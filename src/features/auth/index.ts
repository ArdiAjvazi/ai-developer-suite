export { auth, signIn, signOut, handlers } from "@/server/auth";
export { getOAuthProviderFlags } from "@/server/auth/oauth";
export {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/features/auth/schemas/auth";
