import { describe, it, expect } from 'vitest';
import { computeQuorum } from './quorum';

describe('computeQuorum', () => {
	it('atteint le quorum quand exactement au seuil', () => {
		const result = computeQuorum({
			attendances: [
				{ mode: 'present', vote_weight: 50 },
				{ mode: 'present', vote_weight: 50 }
			],
			totalVoteWeight: 200,
			quorumPct: 50
		});
		expect(result.presentWeight).toBe(100);
		expect(result.ratio).toBe(50);
		expect(result.reached).toBe(true);
	});

	it('ne pas atteindre le quorum sous le seuil', () => {
		const result = computeQuorum({
			attendances: [{ mode: 'present', vote_weight: 30 }],
			totalVoteWeight: 100,
			quorumPct: 50
		});
		expect(result.ratio).toBe(30);
		expect(result.reached).toBe(false);
	});

	it('les représentés comptent comme présents', () => {
		const result = computeQuorum({
			attendances: [
				{ mode: 'present', vote_weight: 30 },
				{ mode: 'represented', vote_weight: 30 }
			],
			totalVoteWeight: 100,
			quorumPct: 50
		});
		expect(result.presentWeight).toBe(60);
		expect(result.reached).toBe(true);
	});

	it('les absents ne comptent pas', () => {
		const result = computeQuorum({
			attendances: [
				{ mode: 'present', vote_weight: 20 },
				{ mode: 'absent', vote_weight: 80 }
			],
			totalVoteWeight: 100,
			quorumPct: 50
		});
		expect(result.presentWeight).toBe(20);
		expect(result.reached).toBe(false);
	});

	it('poids total zéro retourne ratio 0', () => {
		const result = computeQuorum({ attendances: [], totalVoteWeight: 0, quorumPct: 50 });
		expect(result.ratio).toBe(0);
		expect(result.reached).toBe(false);
	});

	it('quorum 100% atteint seulement si tous présents', () => {
		const result = computeQuorum({
			attendances: [{ mode: 'present', vote_weight: 100 }],
			totalVoteWeight: 100,
			quorumPct: 100
		});
		expect(result.reached).toBe(true);
	});
});
