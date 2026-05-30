import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

const ALLOWED_TAGS = [
	'h1',
	'h2',
	'h3',
	'h4',
	'h5',
	'h6',
	'p',
	'br',
	'hr',
	'ul',
	'ol',
	'li',
	'strong',
	'em',
	'del',
	's',
	'blockquote',
	'pre',
	'code',
	'a',
	'img',
	'table',
	'thead',
	'tbody',
	'tr',
	'th',
	'td'
];

const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions['allowedAttributes'] = {
	a: ['href', 'title', 'target', 'rel'],
	img: ['src', 'alt', 'title', 'width', 'height'],
	code: ['class'],
	th: ['align'],
	td: ['align']
};

export async function renderMarkdown(source: string): Promise<string> {
	const rawHtml = await marked(source, { gfm: true, breaks: false });
	return sanitizeHtml(rawHtml, {
		allowedTags: ALLOWED_TAGS,
		allowedAttributes: ALLOWED_ATTRIBUTES,
		// Force rel=noopener on external links
		transformTags: {
			a: (tagName, attribs) => ({
				tagName,
				attribs: { ...attribs, rel: 'noopener noreferrer' }
			})
		}
	});
}
