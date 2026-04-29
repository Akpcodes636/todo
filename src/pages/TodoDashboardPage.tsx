import { useDeferredValue, useEffect, useState } from "react";
import clsx from "clsx";
import { Panel } from "../components/Panel";
import { DashboardSidebar } from "../features/todos/components/DashboardSidebar";
import { ProjectSidebar } from "../features/todos/components/ProjectSidebar";
import { TodoAnalytics } from "../features/todos/components/TodoAnalytics";
import { TodoComposer } from "../features/todos/components/TodoComposer";
import { TodoFilters } from "../features/todos/components/TodoFilters";
import { TodoList } from "../features/todos/components/TodoList";
import {
	useClearCompletedMutation,
	useWorkspaceQuery,
} from "../features/todos/todo.queries";
import { useTodoStore } from "../features/todos/todo.store";
import type { Project, Todo } from "../types/todo";
import {
	buildProjectInsights,
	filterTodos,
	getProjectById,
	getProjectTodos,
	summarizeTodos,
	summarizeWorkspace,
} from "../utils/todo";

const EMPTY_PROJECTS: Project[] = [];
const EMPTY_TODOS: Todo[] = [];

function AppTopBar({
  currentProjectName,
  isMobileSidebarOpen,
  onMenuToggle,
  projects,
  selectedProjectId,
	setSelectedProjectId,
	view,
}: {
  currentProjectName: string | null;
  isMobileSidebarOpen: boolean;
  onMenuToggle: () => void;
  projects: Project[];
	selectedProjectId: string | null;
	setSelectedProjectId: (projectId: string | null) => void;
	view: string;
}) {
	return (
		<header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
			<div className="flex min-h-14 items-center justify-between gap-3 px-3 sm:min-h-16 sm:px-6 lg:px-8">
				{/* Left: menu + logo */}
				<div className="flex min-w-0 items-center gap-2 sm:gap-3">
					<button
						type="button"
						onClick={onMenuToggle}
						className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 lg:hidden"
						aria-expanded={isMobileSidebarOpen}
						aria-label={
							isMobileSidebarOpen
								? "Close navigation menu"
								: "Open navigation menu"
						}
					>
						{isMobileSidebarOpen ? (
							<svg
								viewBox="0 0 16 16"
								aria-hidden="true"
								className="h-4 w-4"
								fill="none"
								stroke="currentColor"
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="1.5"
							>
								<path d="M4 4l8 8" />
								<path d="M12 4 4 12" />
							</svg>
						) : (
							<svg
								viewBox="0 0 16 16"
								aria-hidden="true"
								className="h-4 w-4"
								fill="none"
								stroke="currentColor"
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="1.5"
							>
								<path d="M2.5 4.5h11" />
								<path d="M2.5 8h11" />
								<path d="M2.5 11.5h11" />
							</svg>
						)}
					</button>
					<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-900 text-xs font-semibold text-white sm:h-9 sm:w-9 sm:text-sm">
						TD
					</div>
					<div className="min-w-0">
						<p className="truncate text-sm font-semibold text-slate-950">
							Todo Workspace
						</p>
						<p className="hidden truncate text-xs text-slate-500 sm:block">
							{currentProjectName ?? "No project selected"}
						</p>
					</div>
				</div>

				{/* Right: project select + view badge */}
				<div className="flex shrink-0 items-center gap-2 sm:gap-3">
					<div className="hidden sm:block">
						<select
							value={selectedProjectId ?? ""}
							onChange={(e) => setSelectedProjectId(e.target.value || null)}
							className="w-40 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400 md:w-48"
						>
							{projects.length === 0 ? (
								<option value="">No projects</option>
							) : null}
							{projects.map((p) => (
								<option key={p.id} value={p.id}>
									{p.name}
								</option>
							))}
						</select>
					</div>
					<span className="hidden rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium capitalize text-slate-600 sm:inline-flex">
						{view}
					</span>
				</div>
			</div>
		</header>
	);
}

function Header({
	eyebrow,
	subtitle,
	title,
}: {
	eyebrow: string;
	subtitle: string;
	title: string;
}) {
	return (
		<header className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:gap-3 sm:px-8 sm:py-5">
			<p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">
				{eyebrow}
			</p>
			<div>
				<h2 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl lg:text-3xl">
					{title}
				</h2>
				<p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-600 sm:mt-2 sm:text-base">
					{subtitle}
				</p>
			</div>
		</header>
	);
}

function EmptyState({
	description,
	title,
}: {
	description: string;
	title: string;
}) {
	return (
		<div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center sm:py-12">
			<p className="text-base font-semibold text-slate-900 sm:text-lg">
				{title}
			</p>
			<p className="mt-2 text-sm text-slate-500">{description}</p>
		</div>
	);
}

function StatCard({ label, value }: { label: string; value: string | number }) {
	return (
		<div className="rounded-lg border border-slate-200 bg-slate-50 p-3 sm:p-4">
			<p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
				{label}
			</p>
			<p className="mt-2 text-xl font-semibold tracking-tight text-slate-950 sm:mt-3 sm:text-2xl lg:text-3xl">
				{value}
			</p>
		</div>
	);
}

export function TodoDashboardPage() {
	const filter = useTodoStore((state) => state.filter);
	const selectedProjectId = useTodoStore((state) => state.selectedProjectId);
	const setSelectedProjectId = useTodoStore(
		(state) => state.setSelectedProjectId,
	);
	const view = useTodoStore((state) => state.view);
	const setView = useTodoStore((state) => state.setView);
	const workspaceQuery = useWorkspaceQuery();
	const clearCompleted = useClearCompletedMutation();
	const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

	const projects = workspaceQuery.data?.projects ?? EMPTY_PROJECTS;
	const todos = workspaceQuery.data?.todos ?? EMPTY_TODOS;

	useEffect(() => {
		if (projects.length === 0) {
			if (selectedProjectId !== null) setSelectedProjectId(null);
			return;
		}
		const selectedStillExists = projects.some(
			(p) => p.id === selectedProjectId,
		);
		if (!selectedProjectId || !selectedStillExists) {
			setSelectedProjectId(projects[0].id);
		}
	}, [projects, selectedProjectId, setSelectedProjectId]);

	// Lock body scroll when mobile sidebar is open
	useEffect(() => {
		const html = document.documentElement;
		if (isMobileSidebarOpen) {
			html.style.overflow = "hidden";
		} else {
			html.style.overflow = "";
		}
		return () => {
			html.style.overflow = "";
		};
	}, [isMobileSidebarOpen]);

	const selectedProject = getProjectById(projects, selectedProjectId);
	const projectTodos = getProjectTodos(todos, selectedProject?.id ?? null);
	const deferredTodos = useDeferredValue(projectTodos);
	const visibleTodos = filterTodos(deferredTodos, filter);
	const projectSummary = summarizeTodos(projectTodos);
	const workspaceSummary = summarizeWorkspace(projects, todos);
	const projectInsights = buildProjectInsights(projects, todos);
	const selectedProjectInsight =
		projectInsights.find((i) => i.projectId === selectedProject?.id) ?? null;
	const activeWorkspaceTodos = todos
		.filter((t) => !t.completed)
		.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
		.slice(0, 6);

	function renderTasksSection() {
		if (workspaceQuery.isLoading) {
			return (
				<div className="space-y-3">
					{Array.from({ length: 4 }).map((_, i) => (
						<div
							key={i}
							className="h-20 animate-pulse rounded-3xl bg-slate-100 sm:h-24"
						/>
					))}
				</div>
			);
		}

		if (workspaceQuery.isError) {
			return (
				<div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800 sm:p-5">
					<p className="text-base font-semibold sm:text-lg">
						We hit a loading problem.
					</p>
					<p className="mt-2 text-sm">
						Refresh the workspace and we'll try again.
					</p>
					<button
						type="button"
						onClick={() => void workspaceQuery.refetch()}
						className="mt-4 rounded-full bg-rose-700 px-4 py-2 text-sm font-semibold text-white"
					>
						Retry
					</button>
				</div>
			);
		}

		if (!selectedProject) {
			return (
				<EmptyState
					title="No project selected yet."
					description="Create or select a project to start managing its task lane."
				/>
			);
		}

		if (visibleTodos.length === 0) {
			return (
				<EmptyState
					title="No tasks in this view."
					description="Add a task or switch filters to reveal more of this project."
				/>
			);
		}

		return (
			<TodoList
				todos={visibleTodos}
				isReorderEnabled={filter === "all"}
				projectId={selectedProject.id}
			/>
		);
	}

	function renderOverview() {
		return (
			<div className="space-y-4 sm:space-y-6">
				<Header
					eyebrow="Overview"
					title="Project workspace"
					subtitle="A calmer operating view across the whole workspace with quick access to the work that needs attention."
				/>

				{/* Top stats + current focus */}
				<div className="grid min-w-0 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
					<Panel className="min-w-0 p-4 sm:p-6">
						<div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:grid-cols-4">
							{(
								[
									["Projects", workspaceSummary.projectCount],
									["Total tasks", workspaceSummary.total],
									["Open tasks", workspaceSummary.active],
									["Completion", `${workspaceSummary.completionRate}%`],
								] as const
							).map(([label, value]) => (
								<StatCard key={label} label={label} value={value} />
							))}
						</div>
					</Panel>

					<Panel className="min-w-0 p-4 sm:p-6">
						<p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
							Current focus
						</p>
						<h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-950 sm:text-xl lg:text-2xl">
							{selectedProject?.name ?? "No active project"}
						</h3>
						<p className="mt-2 text-sm leading-6 text-slate-600">
							{selectedProject?.description ??
								"Use the Projects section to create a structured workspace first."}
						</p>
						<div className="mt-4 grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:mt-5">
							<div>
								<p className="text-xl font-semibold text-slate-950 sm:text-2xl">
									{projectSummary.active}
								</p>
								<p className="text-sm text-slate-500">Open in project</p>
							</div>
							<div>
								<p className="text-xl font-semibold text-slate-950 sm:text-2xl">
									{projectSummary.completionRate}%
								</p>
								<p className="text-sm text-slate-500">Project completion</p>
							</div>
						</div>
					</Panel>
				</div>

				{/* Active queue + analytics — stacked full width to give stat cards room */}
				<div className="grid min-w-0 gap-4 sm:gap-6">
					<Panel className="min-w-0 p-4 sm:p-6">
						<div className="flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
							<div>
								<p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
									Active queue
								</p>
								<h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-950 sm:text-xl">
									Recently updated open tasks
								</h3>
							</div>
							<button
								type="button"
								onClick={() => setView("tasks")}
								className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 sm:w-auto"
							>
								Open tasks view
							</button>
						</div>

						<div className="mt-4 min-w-0 space-y-2 sm:mt-5 sm:space-y-3">
							{activeWorkspaceTodos.length === 0 ? (
								<EmptyState
									title="No open tasks right now."
									description="The workspace is clear. Add new work when you're ready."
								/>
							) : (
								activeWorkspaceTodos.map((todo) => {
									const project = projects.find((p) => p.id === todo.projectId);
									return (
										<div
											key={todo.id}
											className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:p-4"
										>
											<div className="flex items-center justify-between gap-3">
												<div className="min-w-0 flex-1">
													<p className="truncate font-semibold text-slate-950 text-sm sm:text-base">
														{todo.title}
													</p>
													<p className="mt-0.5 text-xs text-slate-500 sm:mt-1 sm:text-sm">
														{project?.name ?? "Unknown project"}
													</p>
												</div>
												<button
													type="button"
													onClick={() => {
														setSelectedProjectId(todo.projectId);
														setView("tasks");
													}}
													className="shrink-0 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
												>
													Open
												</button>
											</div>
										</div>
									);
								})
							)}
						</div>
					</Panel>

					<TodoAnalytics
						insights={projectInsights}
						selectedProjectInsight={selectedProjectInsight}
						workspaceSummary={workspaceSummary}
					/>
				</div>
			</div>
		);
	}

	function renderProjects() {
		return (
			<div className="space-y-4 sm:space-y-6">
				<Header
					eyebrow="Projects"
					title="Projects"
					subtitle="Create projects, keep summaries readable, and jump into the right workspace without clutter."
				/>

				<div className="grid gap-4 sm:gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
					<ProjectSidebar
						projects={projects}
						selectedProjectId={selectedProjectId}
						setSelectedProjectId={setSelectedProjectId}
						todos={todos}
					/>

					<div className="space-y-4 sm:space-y-6">
						<Panel className="p-4 sm:p-6">
							<div className="flex flex-wrap items-start justify-between gap-4">
								<div className="min-w-0">
									<p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
										Selected project
									</p>
									<h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
										{selectedProject?.name ?? "No project selected"}
									</h3>
									<p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
										{selectedProject?.description ??
											"Create a project to see its details and task distribution here."}
									</p>
								</div>
								<button
									type="button"
									onClick={() => setView("tasks")}
									disabled={!selectedProject}
									className="shrink-0 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
								>
									Open tasks
								</button>
							</div>

							<div className="mt-5 grid grid-cols-3 gap-3">
								{(
									[
										["Tasks", projectSummary.total],
										["Open", projectSummary.active],
										["Done", projectSummary.completed],
									] as const
								).map(([label, value]) => (
									<StatCard key={label} label={label} value={value} />
								))}
							</div>
						</Panel>

						<Panel className="p-4 sm:p-6">
							<div>
								<p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
									Project list
								</p>
								<h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
									Workspace overview
								</h3>
							</div>

							<div className="mt-4 space-y-2 sm:mt-5 sm:space-y-3">
								{projects.length > 0 ? (
									projects.map((project) => {
										const summary = summarizeTodos(
											getProjectTodos(todos, project.id),
										);
										return (
											<button
												key={project.id}
												type="button"
												onClick={() => setSelectedProjectId(project.id)}
												className={clsx(
													"flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-3 text-left transition sm:px-4 sm:py-4",
													selectedProjectId === project.id
														? "border-slate-300 bg-slate-50"
														: "border-slate-200 bg-white hover:bg-slate-50",
												)}
											>
												<div className="min-w-0 flex-1">
													<div className="flex items-center gap-2">
														<span
															className="h-2.5 w-2.5 shrink-0 rounded-full"
															style={{ backgroundColor: project.color }}
														/>
														<p className="truncate font-semibold text-slate-950 text-sm sm:text-base">
															{project.name}
														</p>
													</div>
													<p className="mt-1 truncate text-xs text-slate-500 sm:text-sm">
														{project.description}
													</p>
												</div>
												<div className="shrink-0 text-right text-xs text-slate-500 sm:text-sm">
													<p>{summary.total} tasks</p>
													<p>{summary.active} open</p>
												</div>
											</button>
										);
									})
								) : (
									<EmptyState
										title="Nothing to show yet."
										description="Create a project to start organizing work."
									/>
								)}
							</div>
						</Panel>
					</div>
				</div>
			</div>
		);
	}

	function renderTasks() {
		return (
			<div className="space-y-4 sm:space-y-6">
				<Header
					eyebrow="Tasks"
					title={
						selectedProject
							? `${selectedProject.name} task board`
							: "Task board"
					}
					subtitle="Keep this view focused on the current project and the work that needs attention."
				/>

				<div className="grid grid-cols-3 gap-3 sm:gap-4">
					{(
						[
							["Tasks", projectSummary.total],
							["Open", projectSummary.active],
							["Done", projectSummary.completed],
						] as const
					).map(([label, value]) => (
						<Panel key={label} className="p-3 sm:p-5">
							<p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
								{label}
							</p>
							<p className="mt-2 text-xl font-semibold tracking-tight text-slate-950 sm:mt-3 sm:text-2xl">
								{value}
							</p>
						</Panel>
					))}
				</div>

				<div className="space-y-4 sm:space-y-6">
					<TodoComposer
						projectId={selectedProject?.id ?? null}
						projectName={selectedProject?.name ?? null}
					/>
					<TodoFilters
						activeCount={projectSummary.active}
						completedCount={projectSummary.completed}
						isClearing={clearCompleted.isPending}
						onClearCompleted={() =>
							selectedProject?.id
								? clearCompleted.mutate(selectedProject.id)
								: undefined
						}
						projectName={selectedProject?.name ?? null}
					/>
					<Panel className="p-4 sm:p-6">{renderTasksSection()}</Panel>
				</div>
			</div>
		);
	}

	function renderAnalytics() {
		return (
			<div className="space-y-4 sm:space-y-6">
				<Header
					eyebrow="Analytics"
					title="Analytics"
					subtitle="Keep metrics and portfolio visibility on their own screen so the task board can stay focused on doing the work."
				/>

				<TodoAnalytics
					insights={projectInsights}
					selectedProjectInsight={selectedProjectInsight}
					workspaceSummary={workspaceSummary}
				/>

				<Panel className="p-4 sm:p-6">
					<div>
						<p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
							Project comparison
						</p>
						<h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
							Portfolio health table
						</h3>
					</div>

					{/* Desktop table */}
					<div className="mt-5 hidden overflow-x-auto md:block">
						<table className="min-w-full border-separate border-spacing-y-2">
							<thead>
								<tr className="text-left text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
									<th className="px-4 pb-2">Project</th>
									<th className="px-4 pb-2">Tasks</th>
									<th className="px-4 pb-2">Open</th>
									<th className="px-4 pb-2">Done</th>
									<th className="px-4 pb-2">Completion</th>
								</tr>
							</thead>
							<tbody>
								{projectInsights.length === 0 ? (
									<tr>
										<td
											colSpan={5}
											className="px-4 py-6 text-sm text-slate-500"
										>
											No projects available yet.
										</td>
									</tr>
								) : (
									projectInsights.map((insight) => (
										<tr
											key={insight.projectId}
											className="rounded-lg bg-slate-50"
										>
											<td className="rounded-l-lg px-4 py-3">
												<button
													type="button"
													onClick={() => {
														setSelectedProjectId(insight.projectId);
														setView("tasks");
													}}
													className="flex items-center gap-3 text-left"
												>
													<span
														className="h-3 w-3 shrink-0 rounded-full"
														style={{ backgroundColor: insight.color }}
													/>
													<span className="font-semibold text-slate-950">
														{insight.projectName}
													</span>
												</button>
											</td>
											<td className="px-4 py-3 text-sm text-slate-700">
												{insight.total}
											</td>
											<td className="px-4 py-3 text-sm text-slate-700">
												{insight.active}
											</td>
											<td className="px-4 py-3 text-sm text-slate-700">
												{insight.completed}
											</td>
											<td className="rounded-r-lg px-4 py-3 text-sm font-medium text-slate-950">
												{insight.completionRate}%
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>

					{/* Mobile cards */}
					<div className="mt-4 space-y-3 md:hidden">
						{projectInsights.length === 0 ? (
							<EmptyState
								title="No analytics yet."
								description="Create a project to start seeing portfolio health."
							/>
						) : (
							projectInsights.map((insight) => (
								<button
									key={insight.projectId}
									type="button"
									onClick={() => {
										setSelectedProjectId(insight.projectId);
										setView("tasks");
									}}
									className="w-full rounded-lg border border-slate-200 bg-slate-50 p-4 text-left"
								>
									<div className="flex items-center justify-between gap-3">
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-2">
												<span
													className="h-2.5 w-2.5 shrink-0 rounded-full"
													style={{ backgroundColor: insight.color }}
												/>
												<p className="truncate font-semibold text-slate-950">
													{insight.projectName}
												</p>
											</div>
											<p className="mt-1 text-sm text-slate-500">
												{insight.active} open, {insight.completed} completed
											</p>
										</div>
										<span className="text-sm font-medium text-slate-700">
											{insight.completionRate}%
										</span>
									</div>
									<div className="mt-3 h-2 rounded-full bg-white">
										<div
											className="h-2 rounded-full"
											style={{
												backgroundColor: insight.color,
												width: `${insight.completionRate}%`,
											}}
										/>
									</div>
								</button>
							))
						)}
					</div>
				</Panel>
			</div>
		);
	}

	const content =
		view === "overview"
			? renderOverview()
			: view === "projects"
				? renderProjects()
				: view === "tasks"
					? renderTasks()
					: renderAnalytics();

	return (
		<>
			<AppTopBar
				currentProjectName={selectedProject?.name ?? null}
				isMobileSidebarOpen={isMobileSidebarOpen}
				onMenuToggle={() => setIsMobileSidebarOpen((open) => !open)}
				projects={projects}
				selectedProjectId={selectedProjectId}
				setSelectedProjectId={(id) => {
					setSelectedProjectId(id);
					setIsMobileSidebarOpen(false);
				}}
				view={view}
			/>

			{/* Mobile sidebar — lives outside <main> so scroll lock on body doesn't affect it */}
			{isMobileSidebarOpen && (
				<div className="fixed inset-0 z-40 lg:hidden">
					{/* Backdrop */}
					<div
						className="absolute inset-0 bg-slate-950/40"
						onClick={() => setIsMobileSidebarOpen(false)}
					/>

					{/* Drawer panel */}
					<div
						className="absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col bg-slate-50 shadow-2xl animate-slide-in"
						onClick={(e) => e.stopPropagation()}
					>
						{/* Header */}
						<div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
							<p className="text-sm font-semibold text-slate-950">Navigation</p>
							<button
								type="button"
								onClick={() => setIsMobileSidebarOpen(false)}
								className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
							>
								Close
							</button>
						</div>

						{/* Project switcher */}
						<div className="border-b border-slate-200 bg-white px-4 py-3">
							<label
								htmlFor="mobile-project-switcher"
								className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500"
							>
								Active project
							</label>
							<select
								id="mobile-project-switcher"
								value={selectedProjectId ?? ""}
								onChange={(e) => {
									setSelectedProjectId(e.target.value || null);
									setIsMobileSidebarOpen(false);
								}}
								className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-slate-400"
							>
								{projects.length === 0 ? (
									<option value="">No projects</option>
								) : null}
								{projects.map((p) => (
									<option key={p.id} value={p.id}>
										{p.name}
									</option>
								))}
							</select>
						</div>

						{/* Nav content */}
						<div className="flex-1 overflow-y-auto p-4">
							<DashboardSidebar
								isMobile
								projects={projects}
								selectedProjectId={selectedProjectId}
								setSelectedProjectId={(id) => {
									setSelectedProjectId(id);
									setIsMobileSidebarOpen(false);
								}}
								setView={(v) => {
									setView(v);
									setIsMobileSidebarOpen(false);
								}}
								todos={todos}
								view={view}
							/>
						</div>
					</div>
				</div>
			)}

			<main className="min-h-screen overflow-x-clip bg-slate-50 px-3 pb-8 pt-16 text-slate-900 sm:px-6 sm:pt-20 lg:px-8">
				<div className="grid min-w-0 gap-4 overflow-x-clip sm:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)]">
					<div className="hidden lg:block">
						<DashboardSidebar
							projects={projects}
							selectedProjectId={selectedProjectId}
							setSelectedProjectId={setSelectedProjectId}
							setView={setView}
							todos={todos}
							view={view}
						/>
					</div>
					<section className="min-w-0 overflow-x-clip">{content}</section>
				</div>
			</main>
		</>
	);
}
