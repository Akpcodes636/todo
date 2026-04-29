import clsx from "clsx";
import type { Project, Todo } from "../../../types/todo";
import { getProjectTodos, summarizeTodos } from "../../../utils/todo";
import type { DashboardView } from "../todo.store";

interface DashboardSidebarProps {
	isMobile?: boolean;
	projects: Project[];
	selectedProjectId: string | null;
	setSelectedProjectId: (projectId: string) => void;
	setView: (view: DashboardView) => void;
	todos: Todo[];
	view: DashboardView;
}

const navItems: Array<{
	description: string;
	label: string;
	value: DashboardView;
}> = [
	{
		description: "Workspace summary and momentum",
		label: "Overview",
		value: "overview",
	},
	{
		description: "Manage projects and structure",
		label: "Projects",
		value: "projects",
	},
	{ description: "Focus on project execution", label: "Tasks", value: "tasks" },
	{
		description: "Portfolio progress and health",
		label: "Analytics",
		value: "analytics",
	},
];

export function DashboardSidebar({
	isMobile = false,
	projects,
	selectedProjectId,
	setSelectedProjectId,
	setView,
	todos,
	view,
}: DashboardSidebarProps) {
	return (
		<aside
			className={clsx(
				"rounded-xl border border-slate-200 bg-white shadow-sm",
				isMobile
					? "border-0 bg-transparent shadow-none"
					: "p-3 lg:sticky lg:top-18 lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto",
			)}
		>
			{/* Workspace blurb — hide on mobile since it's shown elsewhere */}
			{!isMobile && (
				<div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
					<p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">
						Workspace
					</p>
					<h1 className="mt-2 text-base font-semibold tracking-tight text-slate-950 xl:text-lg">
						Project dashboard
					</h1>
					<p className="mt-2 text-xs leading-5 text-slate-600 xl:text-sm xl:leading-6">
						A calmer workspace for projects, tasks, and reporting.
					</p>
				</div>
			)}

			{/* Nav */}
			<nav className={clsx("space-y-1", !isMobile && "mt-4")}>
				{navItems.map((item) => (
					<button
						key={item.value}
						type="button"
						onClick={() => setView(item.value)}
						className={clsx(
							"w-full rounded-lg border px-3 py-2.5 text-left transition",
							view === item.value
								? "border-slate-200 bg-slate-100 text-slate-950"
								: "border-transparent bg-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50",
						)}
					>
						<p className="text-sm font-semibold">{item.label}</p>
						<p className="mt-0.5 text-xs text-slate-500">{item.description}</p>
					</button>
				))}
			</nav>

			{/* Quick projects */}
			<div className="mt-5">
				<div className="flex items-center justify-between">
					<p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">
						Quick projects
					</p>
					<button
						type="button"
						onClick={() => setView("projects")}
						className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
					>
						Manage
					</button>
				</div>

				<div className="mt-3 space-y-1.5">
					{projects.length === 0 ? (
						<div className="rounded-lg border border-dashed border-slate-200 px-4 py-5 text-xs text-slate-500">
							Add a project from the Projects view to get started.
						</div>
					) : (
						projects.map((project) => {
							const summary = summarizeTodos(
								getProjectTodos(todos, project.id),
							);
							const isSelected = selectedProjectId === project.id;

							return (
								<button
									key={project.id}
									type="button"
									onClick={() => {
										setSelectedProjectId(project.id);
										setView("tasks");
									}}
									className={clsx(
										"w-full rounded-lg border px-3 py-2.5 text-left transition",
										isSelected
											? "border-slate-200 bg-slate-100 text-slate-950"
											: "border-slate-200 bg-white hover:bg-slate-50",
									)}
								>
									<div className="flex items-center justify-between gap-2">
										<div className="flex min-w-0 items-center gap-2">
											<span
												className="h-2 w-2 shrink-0 rounded-full"
												style={{ backgroundColor: project.color }}
											/>
											<p className="truncate text-sm font-semibold">
												{project.name}
											</p>
										</div>
										<span
											className={clsx(
												"shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
												isSelected
													? "bg-white text-slate-700"
													: "bg-slate-100 text-slate-600",
											)}
										>
											{summary.total}
										</span>
									</div>
									<p className="mt-0.5 truncate pl-4 text-xs text-slate-500">
										{project.description}
									</p>
								</button>
							);
						})
					)}
				</div>
			</div>
		</aside>
	);
}
