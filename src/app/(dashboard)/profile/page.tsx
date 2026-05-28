"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { useAuthStore } from "@/lib/auth/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { normalizeMediaUrl } from "@/lib/utils";
import { User, Camera, Lock, Shield, Smartphone, Trash2 } from "lucide-react";
import type { User as UserType, ApiResponse } from "@/lib/types";

type TwoFactorDevice = {
  id: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  lastUsedAt: string;
  trustedUntil: string;
};

type TwoFactorStatus = {
  twoFactorEnabled: boolean;
  trustedDevices: TwoFactorDevice[];
};

export default function ProfilePage() {
  const { user, setAuth } = useAuthStore();
  const [profile, setProfile] = useState<UserType | null>(null);
  const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [updatingTwoFactor, setUpdatingTwoFactor] = useState(false);
  const [revokingDeviceId, setRevokingDeviceId] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [form, setForm] = useState({ firstName: "", lastName: "" });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [disableTwoFactorPassword, setDisableTwoFactorPassword] = useState("");

  const avatarPreview = useMemo(
    () =>
      avatarFile
        ? URL.createObjectURL(avatarFile)
        : normalizeMediaUrl(profile?.avatar) || null,
    [avatarFile, profile?.avatar]
  );

  useEffect(() => {
    return () => {
      if (avatarFile && avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarFile, avatarPreview]);

  async function loadSecurityData() {
    const [profileRes, twoFactorRes] = await Promise.all([
      apiFetch<ApiResponse<UserType>>("/auth/me"),
      apiFetch<{ data: TwoFactorStatus }>("/auth/2fa/status"),
    ]);

    setProfile(profileRes.data);
    setTwoFactorStatus(twoFactorRes.data);
    setForm({
      firstName: profileRes.data.firstName || "",
      lastName: profileRes.data.lastName || "",
    });
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchProfile() {
      setLoading(true);
      try {
        const [profileRes, twoFactorRes] = await Promise.all([
          apiFetch<ApiResponse<UserType>>("/auth/me"),
          apiFetch<{ data: TwoFactorStatus }>("/auth/2fa/status"),
        ]);

        if (!cancelled) {
          setProfile(profileRes.data);
          setTwoFactorStatus(twoFactorRes.data);
          setForm({
            firstName: profileRes.data.firstName || "",
            lastName: profileRes.data.lastName || "",
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load profile");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const body = new FormData();
      body.append("firstName", form.firstName);
      body.append("lastName", form.lastName);
      if (avatarFile) body.append("avatar", avatarFile);
      const res = await apiFetch<ApiResponse<UserType>>("/users/me", {
        method: "PATCH",
        body,
      });
      setProfile(res.data);
      if (user && res.data) {
        setAuth(
          { ...user, ...res.data },
          {
            accessToken: useAuthStore.getState().accessToken || "",
            refreshToken: useAuthStore.getState().refreshToken || "",
          }
        );
      }
      setAvatarFile(null);
      setSuccessMessage("Profile updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setUpdatingPassword(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await apiFetch<ApiResponse<unknown>>("/auth/update-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setSuccessMessage("Password updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleEnableTwoFactor = async () => {
    setUpdatingTwoFactor(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await apiFetch<ApiResponse<{ message: string }>>("/auth/2fa/enable", {
        method: "POST",
      });
      await loadSecurityData();
      setSuccessMessage(res.data.message || "Two-factor authentication enabled.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enable 2FA");
    } finally {
      setUpdatingTwoFactor(false);
    }
  };

  const handleDisableTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingTwoFactor(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await apiFetch<ApiResponse<{ message: string }>>("/auth/2fa/disable", {
        method: "POST",
        body: JSON.stringify({ password: disableTwoFactorPassword }),
      });
      setDisableTwoFactorPassword("");
      await loadSecurityData();
      setSuccessMessage(res.data.message || "Two-factor authentication disabled.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disable 2FA");
    } finally {
      setUpdatingTwoFactor(false);
    }
  };

  const handleRevokeDevice = async (deviceId: string) => {
    setRevokingDeviceId(deviceId);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await apiFetch<ApiResponse<{ message: string }>>(`/auth/2fa/devices/${deviceId}`, {
        method: "DELETE",
      });
      await loadSecurityData();
      setSuccessMessage(res.data.message || "Trusted device revoked.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke device");
    } finally {
      setRevokingDeviceId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <User className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
      </div>

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}
      {successMessage && <p className="text-emerald-400 text-sm">{successMessage}</p>}

      {!loading && profile && (
        <>
          <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Edit Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      {avatarPreview ? (
                        <Image
                          src={avatarPreview}
                          alt="avatar"
                          width={64}
                          height={64}
                          unoptimized
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="space-y-2 flex-1">
                      <Label>Avatar</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Name</Label>
                      <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={profile.email} disabled />
                  </div>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save Profile"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Two-Factor Authentication
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-4 py-3">
                  <div>
                    <p className="font-medium">Status</p>
                    <p className="text-sm text-muted-foreground">
                      Require a verification code on sign-in.
                    </p>
                  </div>
                  <Badge variant={twoFactorStatus?.twoFactorEnabled ? "default" : "secondary"}>
                    {twoFactorStatus?.twoFactorEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>

                {twoFactorStatus?.twoFactorEnabled ? (
                  <form onSubmit={handleDisableTwoFactor} className="space-y-3">
                    <div className="space-y-2">
                      <Label>Confirm password to disable 2FA</Label>
                      <Input
                        type="password"
                        value={disableTwoFactorPassword}
                        onChange={(e) => setDisableTwoFactorPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" variant="outline" disabled={updatingTwoFactor}>
                      {updatingTwoFactor ? "Disabling..." : "Disable 2FA"}
                    </Button>
                  </form>
                ) : (
                  <Button onClick={handleEnableTwoFactor} disabled={updatingTwoFactor}>
                    {updatingTwoFactor ? "Enabling..." : "Enable 2FA"}
                  </Button>
                )}

                <div className="rounded-lg border border-border/60 bg-background/40 p-4 text-sm text-muted-foreground">
                  Trusted devices skip the extra code until their trust window expires.
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Change Password
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Current Password</Label>
                    <Input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <Input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm New Password</Label>
                    <Input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={updatingPassword}>
                    {updatingPassword ? "Updating..." : "Update Password"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  Trusted Devices
                </CardTitle>
              </CardHeader>
              <CardContent>
                {twoFactorStatus?.trustedDevices?.length ? (
                  <div className="space-y-3">
                    {twoFactorStatus.trustedDevices.map((device) => (
                      <div
                        key={device.id}
                        className="flex flex-col gap-3 rounded-lg border border-border/60 bg-background/40 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-medium">{device.userAgent || "Unknown device"}</p>
                          <p className="text-sm text-muted-foreground">
                            {device.ipAddress || "Unknown IP"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Last used {new Date(device.lastUsedAt).toLocaleString()} • trusted until {new Date(device.trustedUntil).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          className="text-destructive"
                          disabled={revokingDeviceId === device.id}
                          onClick={() => handleRevokeDevice(device.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {revokingDeviceId === device.id ? "Revoking..." : "Revoke"}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border bg-background/30 p-6 text-sm text-muted-foreground">
                    No trusted devices saved yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
