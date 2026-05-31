export interface QuorumInput {
	attendances: { mode: string; vote_weight: number }[];
	totalVoteWeight: number;
	quorumPct: number;
}

export interface QuorumResult {
	presentWeight: number;
	totalWeight: number;
	quorumPct: number;
	ratio: number;
	reached: boolean;
}

export function computeQuorum(input: QuorumInput): QuorumResult {
	const presentWeight = input.attendances
		.filter((a) => a.mode === 'present' || a.mode === 'represented')
		.reduce((sum, a) => sum + a.vote_weight, 0);

	const totalWeight = input.totalVoteWeight;
	const ratio = totalWeight > 0 ? (presentWeight / totalWeight) * 100 : 0;
	const reached = ratio >= input.quorumPct;

	return { presentWeight, totalWeight, quorumPct: input.quorumPct, ratio, reached };
}
