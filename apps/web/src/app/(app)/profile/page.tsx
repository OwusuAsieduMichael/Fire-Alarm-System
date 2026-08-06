"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateProfile } from "@/hooks/use-settings";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const updateProfile = useUpdateProfile();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");

  useEffect(() => {
    setName(user?.name ?? "");
    setPhone(user?.phone ?? "");
  }, [user?.name, user?.phone]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Profile"
        description="Manage your FireGuard operator identity."
      />

      <Card className="max-w-xl border-border/55">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
          <div>
            <p className="metric-label">Operator</p>
            <CardTitle className="mt-1.5 text-lg">
              {user?.name ?? "Operator"}
            </CardTitle>
          </div>
          <Badge variant="secondary">{user?.role ?? "USER"}</Badge>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email ?? ""} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Display name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={phone ?? ""}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 0100"
            />
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              disabled={updateProfile.isPending}
              onClick={() =>
                updateProfile.mutate({
                  name: name.trim(),
                  phone: phone?.trim() || null,
                })
              }
            >
              {updateProfile.isPending ? "Saving…" : "Save changes"}
            </Button>
            <Button variant="outline" onClick={logout}>
              Sign out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
