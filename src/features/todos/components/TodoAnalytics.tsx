import clsx from "clsx";
import type { ProjectInsight, WorkspaceSummary } from "../../../types/todo";

interface TodoAnalyticsProps {
	insights: ProjectInsight[];
	selectedProjectInsight: ProjectInsight | null;
	workspaceSummary: WorkspaceSummary;
}

const cards = [
	{
		key: "projectCount",
		label: "Projects",
		tone: "bg-amber-100 text-amber-900",
	},
	{ key: "total", label: "Workspace tasks", tone: "bg-sky-100 text-sky-900" },
	{ key: "active", label: "Open work", tone: "bg-rose-100 text-rose-900" },
	{
		key: "emptyProjectCount",
		label: "Empty projects",
		tone: "bg-emerald-100 text-emerald-900",
	},
] as const satisfies ReadonlyArray<{
	key: keyof WorkspaceSummary;
	label: string;
	tone: string;
}>;

export function TodoAnalytics({
	insights,
	selectedProjectInsight,
	workspaceSummary,
}: TodoAnalyticsProps) {
	const leadingProject =
		[...insights].sort((a, b) => b.completionRate - a.completionRate)[0] ??
		null;

	return (
		<section className="grid min-w-0 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
			{/* Stat cards — 2 cols mobile/tablet, 4 cols at xl where they have enough room */}
			<div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-2">
				{cards.map((card) => (
					<article
						key={card.key}
						className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
					>
						<span
							className={clsx(
								"inline-flex rounded-md px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em] sm:px-2.5 sm:text-[11px]",
								card.tone,
							)}
						>
							{card.label}
						</span>
						<p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:mt-4 sm:text-3xl">
							{workspaceSummary[card.key]}
						</p>
					</article>
				))}
			</div>

			{/* Selected project panel */}
			<article className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0">
						<p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
							Analytics view
						</p>
						<h3 className="mt-1.5 truncate text-xl font-semibold tracking-tight text-slate-950 sm:mt-2 sm:text-2xl">
							{selectedProjectInsight
								? selectedProjectInsight.projectName
								: "No project selected"}
						</h3>
					</div>
					{selectedProjectInsight ? (
						<span
							className="mt-1 h-4 w-4 shrink-0 rounded-full"
							style={{ backgroundColor: selectedProjectInsight.color }}
						/>
					) : null}
				</div>

				<div className="mt-4 grid grid-cols-2 gap-3 sm:mt-5 sm:gap-4">
					<div>
						<p className="text-2xl font-semibold text-slate-950 sm:text-3xl">
							{selectedProjectInsight?.total ?? 0}
						</p>
						<p className="text-xs text-slate-500 sm:text-sm">
							Tasks in project
						</p>
					</div>
					<div>
						<p className="text-2xl font-semibold text-slate-950 sm:text-3xl">
							{selectedProjectInsight?.completionRate ?? 0}%
						</p>
						<p className="text-xs text-slate-500 sm:text-sm">Completion rate</p>
					</div>
				</div>

				<div className="mt-5 space-y-3">
					<div className="flex items-center justify-between text-xs text-slate-500 sm:text-sm">
						<span>Project progress board</span>
						<span className="truncate font-medium text-slate-700 ml-2">
							{leadingProject?.projectName ?? "No projects yet"}
						</span>
					</div>

					{insights.length === 0 ? (
						<p className="text-xs text-slate-500 sm:text-sm">
							Add a project to start tracking progress.
						</p>
					) : (
						insights.map((insight) => (
							<div key={insight.projectId}>
								<div className="mb-1 flex items-center justify-between text-xs sm:text-sm">
									<span className="truncate text-slate-700">
										{insight.projectName}
									</span>
									<span className="ml-2 shrink-0 text-slate-500">
										{insight.completed}/{insight.total}
									</span>
								</div>
								<div className="h-1.5 rounded-full bg-slate-100 sm:h-2">
									<div
										className="h-full rounded-full transition-all"
										style={{
											backgroundColor: insight.color,
											width: `${insight.completionRate}%`,
										}}
									/>
								</div>
							</div>
						))
					)}
				</div>
			</article>
		</section>
	);
}
