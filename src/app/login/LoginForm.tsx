"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

type LoginValues = {
  email: string;
  password: string;
};

// Expresión razonable para validar el formato del correo en el cliente.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    defaultValues: { email: "", password: ""},
    mode: "onTouched",
  });

  const onSubmit = async (values: LoginValues) => {
    setSubmitError(null);
    try {
      // El backend autentica por email (GetUserByEmail), así que enviamos el correo como username.
      
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: values.email, password: values.password }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { message?: string };
        setSubmitError(payload.message ?? "No se pudo iniciar sesión.");
        return;
      }

      router.push("/quinela");
      router.refresh();
    } catch {
      setSubmitError("No se pudo iniciar sesión. Inténtalo de nuevo.");
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      sx={{ width: "100%" }}
    >
      <Stack spacing={2.5}>
        {submitError && <Alert severity="error">{submitError}</Alert>}

        <TextField
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          autoFocus
          fullWidth
          error={Boolean(errors.email)}
          helperText={errors.email?.message}
          {...register("email", {
            required: "El correo es obligatorio",
            pattern: {
              value: EMAIL_REGEX,
              message: "Introduce un correo válido",
            },
          })}
        />

        <TextField
          label="Contraseña"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          fullWidth
          error={Boolean(errors.password)}
          helperText={errors.password?.message}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    aria-label={
                      showPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                    onClick={() => setShowPassword((v) => !v)}
                    size="small"
                    sx={{ minWidth: "auto" }}
                  >
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </Button>
                </InputAdornment>
              ),
            },
          }}
          {...register("password", {
            required: "La contraseña es obligatoria",
            minLength: {
              value: 3,
              message: "Debe tener al menos 3 caracteres",
            },
          })}
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={isSubmitting}
          startIcon={
            isSubmitting ? (
              <CircularProgress size={18} color="inherit" />
            ) : undefined
          }
        >
          {isSubmitting ? "Ingresando…" : "Iniciar sesión"}
        </Button>
      </Stack>
    </Box>
  );
}
