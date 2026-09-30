const { z } = require("zod");
const ApiError = require("../utils/apiError");

const emailSchema = z
	.string()
	.trim()
	.max(254)
	.email()
	.transform((email) => email.toLowerCase());

const passwordSchema = z
	.string()
	.min(8)
	.refine((password) => Buffer.byteLength(password, "utf8") <= 72, {
		message: "Password must be no more than 72 bytes",
	});

const phoneSchema = z
	.string()
	.trim()
	.max(24)
	.regex(/^\+?[0-9][0-9\s().-]*$/)
	.refine((phone) => phone.replace(/\D/g, "").length === 10, {
		message: "Phone number must contain exactly 10 digits",
	});

const registerSchema = z.object({
	name: z.string().trim().max(100).optional(),
	email: emailSchema,
	password: passwordSchema,
	phone: phoneSchema,
});

const loginSchema = z.object({
	email: emailSchema,
	password: passwordSchema,
});

const changePasswordSchema = z.object({
	currentPassword: passwordSchema,
	newPassword: passwordSchema,
});

const forgotPasswordSchema = z.object({
	email: emailSchema,
});

const resetPasswordSchema = z.object({
	password: passwordSchema,
});

const resetPasswordParamsSchema = z.object({
	token: z.string().regex(/^[a-f0-9]{64}$/i, "Invalid or expired password reset token"),
});

function validateRequest({ body, params } = {}) {
	return (req, res, next) => {
		for (const [source, schema] of [["body", body], ["params", params]]) {
			if (!schema) {
				continue;
			}

			const result = schema.safeParse(req[source]);
			if (!result.success) {
				const errors = result.error.issues.map((issue) => ({
						field: issue.path.join("."),
						message: issue.message,
					}));
				return next(new ApiError(400, "Request validation failed", errors));
			}

			if (source === "body") {
				req.body = result.data;
			}
		}

		return next();
	};
}

module.exports = {
	changePasswordSchema,
	forgotPasswordSchema,
	loginSchema,
	registerSchema,
	resetPasswordParamsSchema,
	resetPasswordSchema,
	validateRequest,
};
