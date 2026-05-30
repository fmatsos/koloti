import nodemailer from 'nodemailer';
import {
	SMTP_HOST,
	SMTP_PORT,
	SMTP_USER,
	SMTP_PASS,
	SMTP_FROM,
	SMTP_FROM_NAME
} from '$env/static/private';

interface MailOptions {
	to: string;
	subject: string;
	text: string;
	html?: string;
}

export async function sendMail({ to, subject, text, html }: MailOptions): Promise<void> {
	const transporter = nodemailer.createTransport({
		host: SMTP_HOST,
		port: Number(SMTP_PORT),
		secure: false,
		auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined
	});

	await transporter.sendMail({
		from: `"${SMTP_FROM_NAME}" <${SMTP_FROM}>`,
		to,
		subject,
		text,
		html: html ?? text
	});
}
