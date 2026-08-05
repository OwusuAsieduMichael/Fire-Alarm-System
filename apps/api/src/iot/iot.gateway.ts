import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { IotService } from './iot.service';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  },
})
export class IotGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(IotGateway.name);

  @WebSocketServer()
  server!: Server;

  /** deviceKey -> socket id for real ESP32 clients on /iot namespace */
  private readonly deviceSockets = new Map<string, string>();

  constructor(private readonly iotService: IotService) {}

  afterInit(server: Server) {
    this.iotService.setEmitters(
      (event, payload) => {
        server.emit(event, payload);
        server.of('/iot').emit(event, payload);
      },
      (deviceKey, event, payload) => {
        const socketId = this.deviceSockets.get(deviceKey);
        if (socketId) {
          server.of('/iot').to(socketId).emit(event, payload);
        }
      },
    );

    const iotNs = server.of('/iot');

    iotNs.on('connection', (socket: Socket) => {
      void this.handleIotConnection(socket);
    });

    this.logger.log('Socket.IO gateway initialized (default + /iot)');
  }

  handleConnection(client: Socket) {
    this.logger.debug(`Dashboard client connected: ${client.id}`);
    client.emit('connected', {
      message: 'FireGuard dashboard socket ready',
      liveStates: this.iotService.getAllLiveStates(),
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  private async handleIotConnection(socket: Socket) {
    const deviceKey =
      (socket.handshake.auth?.deviceKey as string | undefined) ||
      (socket.handshake.query?.deviceKey as string | undefined);

    if (!deviceKey) {
      socket.emit('error', { message: 'deviceKey required' });
      socket.disconnect(true);
      return;
    }

    try {
      const state = await this.iotService.markDeviceConnected(deviceKey, {
        ipAddress: socket.handshake.address,
      });

      this.deviceSockets.set(deviceKey, socket.id);
      socket.data.deviceKey = deviceKey;

      socket.emit('device:registered', {
        deviceId: state.deviceId,
        deviceKey,
        state,
      });

      this.logger.log(`ESP32 joined /iot: ${deviceKey}`);
    } catch {
      socket.emit('error', { message: `Unknown deviceKey: ${deviceKey}` });
      socket.disconnect(true);
      return;
    }

    socket.on('sensor:data', (data: unknown) => {
      void this.onSensorData(socket, data);
    });

    socket.on('disconnect', () => {
      void this.onIotDisconnect(socket);
    });
  }

  private async onSensorData(socket: Socket, data: unknown) {
    const deviceKey = socket.data.deviceKey as string | undefined;
    if (!deviceKey || !data || typeof data !== 'object') {
      return;
    }

    const payload = data as {
      smokeLevel?: number;
      flameDetected?: boolean;
      temperature?: number;
      humidity?: number;
      buzzerActive?: boolean;
      ledStatus?: string;
      alarmActive?: boolean;
      lcdMessage?: string;
    };

    try {
      await this.iotService.ingestSensorData(
        deviceKey,
        {
          smokeLevel: Number(payload.smokeLevel ?? 0),
          flameDetected: Boolean(payload.flameDetected),
          temperature: payload.temperature,
          humidity: payload.humidity,
          buzzerActive: payload.buzzerActive,
          ledStatus: payload.ledStatus,
          alarmActive: payload.alarmActive,
          lcdMessage: payload.lcdMessage,
        },
        { persist: true },
      );
    } catch (error) {
      this.logger.warn(
        `sensor:data failed: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  private async onIotDisconnect(socket: Socket) {
    const deviceKey = socket.data.deviceKey as string | undefined;
    if (!deviceKey) {
      return;
    }

    if (this.deviceSockets.get(deviceKey) === socket.id) {
      this.deviceSockets.delete(deviceKey);
      await this.iotService.markDeviceDisconnected(deviceKey);
    }
  }

  @SubscribeMessage('dashboard:subscribe')
  handleSubscribe(@ConnectedSocket() client: Socket) {
    client.join('dashboard');
    return {
      event: 'dashboard:subscribed',
      data: {
        liveStates: this.iotService.getAllLiveStates(),
      },
    };
  }

  @SubscribeMessage('control:command')
  async handleControlFromSocket(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: { deviceId: string; action: string },
  ) {
    if (!body?.deviceId || !body?.action) {
      return { event: 'error', data: { message: 'deviceId and action required' } };
    }

    const state = await this.iotService.handleControlCommand({
      deviceId: body.deviceId,
      action: body.action as
        | 'test-alarm'
        | 'reset-alarm'
        | 'emergency'
        | 'buzzer-on'
        | 'buzzer-off',
      requestedBy: client.id,
    });

    return { event: 'control:ack', data: state };
  }
}
