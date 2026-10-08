import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SocialDeskResetPassword() {
  const [pw, setPw] = useState("");
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form
        className="w-full max-w-sm space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const { error } = await supabase.auth.updateUser({ password: pw });
          if (error) {
            toast.error(error.message);
            return;
          }
          toast.success("Password updated");
          navigate("/social_desk/dashboard");
        }}
      >
        <h1 className="text-2xl font-bold">Set a new password</h1>
        <div className="space-y-1.5">
          <Label htmlFor="pw">New password</Label>
          <Input id="pw" type="password" minLength={8} required value={pw} onChange={(e) => setPw(e.target.value)} />
        </div>
        <Button type="submit" className="w-full">Update password</Button>
      </form>
    </div>
  );
}


