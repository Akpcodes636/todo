import { useForm } from "react-hook-form";
import clsx from "clsx";
import type { Project, Todo } from "../../../types/todo";
import { getProjectTodos, summarizeTodos } from "../../../utils/todo";
import {
	useCreateProjectMutation,
	useDeleteProjectMutation,
} from "../todo.queries";

interface ProjectSidebarProps {
	projects: Project[];
	selectedProjectId: string | null;
	setSelectedProjectId: (projectId: string) => void;
	todos: Todo[];
}

interface ProjectForm {
	name: string;
	description: string;
}

export function ProjectSidebar({
	projects,
	selectedProjectId,
	setSelectedProjectId,
	todos,
}: ProjectSidebarProps) {
	const createProject = useCreateProjectMutation();
	const deleteProject = useDeleteProjectMutation();
	const {
		formState: { errors },
		handleSubmit,
		register,
		reset,
	} = useForm<ProjectForm>({ defaultValues: { description: "", name: "" } });

	async function onSubmit(values: ProjectForm) {
		const project = await createProject.mutateAsync(values);
		setSelectedProjectId(project.id);
		reset();
	}

	return (
		<aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
			<div>
				<p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">
					Projects
				</p>
				<h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
					Organize workspaces
				</h2>
				<p className="mt-2 text-sm leading-6 text-slate-600">
					Group tasks by initiative. Deleting a project removes every task
					inside it.
				</p>
			</div>

			<form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-2.5">
				<input
					type="text"
					placeholder="New project name"
					className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-400 sm:py-3"
					{...register("name", {
						required: "Add a project name",
						validate: (value) =>
							value.trim().length > 0 || "Add a project name",
						maxLength: 60,
					})}
				/>
				<textarea
					rows={2}
					placeholder="Short description"
					className="w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-400 sm:rows-3 sm:py-3"
					{...register("description", { maxLength: 140 })}
				/>
				<button
					type="submit"
					disabled={createProject.isPending}
					className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:py-3"
				>
					{createProject.isPending ? "Creating..." : "Add project"}
				</button>
				{errors.name ? (
					<p className="text-sm text-rose-600">{errors.name.message}</p>
				) : null}
			</form>

			<div className="mt-5 space-y-2.5 sm:mt-6 sm:space-y-3">
				{projects.length === 0 ? (
					<div className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
						No projects yet. Create one to start grouping todos.
					</div>
				) : (
					projects.map((project) => {
						const summary = summarizeTodos(getProjectTodos(todos, project.id));
						const isSelected = selectedProjectId === project.id;

						return (
							<div
								key={project.id}
								className={clsx(
									"rounded-xl border p-3 transition sm:p-4",
									isSelected
										? "border-slate-300 bg-slate-50"
										: "border-slate-200 bg-white hover:bg-slate-50",
								)}
							>
								<button
									type="button"
									onClick={() => setSelectedProjectId(project.id)}
									className="w-full text-left"
								>
									<div className="flex items-start justify-between gap-3">
										<div className="min-w-0">
											<div className="flex items-center gap-2">
												<span
													className="h-2.5 w-2.5 shrink-0 rounded-full"
													style={{ backgroundColor: project.color }}
												/>
												<p className="truncate font-semibold text-slate-950">
													{project.name}
												</p>
											</div>
											<p className="mt-1 truncate text-xs text-slate-500 sm:text-sm">
												{project.description}
											</p>
										</div>
										<span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
											{summary.total}
										</span>
									</div>
									<div className="mt-3 flex items-center justify-between text-xs text-slate-500">
										<span>{summary.active} active</span>
										<span>{summary.completed} completed</span>
									</div>
								</button>

								<button
									type="button"
									onClick={() => void deleteProject.mutateAsync(project.id)}
									className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
								>
									Remove
								</button>
							</div>
						);
					})
				)}
			</div>
		</aside>
	);
}
