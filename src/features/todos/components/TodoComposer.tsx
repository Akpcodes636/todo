import { useForm } from "react-hook-form";
import { useCreateTodoMutation } from "../todo.queries";

interface TodoComposerProps {
	projectId: string | null;
	projectName: string | null;
}

interface TodoComposerForm {
	title: string;
}

export function TodoComposer({ projectId, projectName }: TodoComposerProps) {
	const createTodo = useCreateTodoMutation();
	const {
		formState: { errors },
		handleSubmit,
		register,
		reset,
	} = useForm<TodoComposerForm>({ defaultValues: { title: "" } });

	async function onSubmit(values: TodoComposerForm) {
		if (!projectId) return;
		await createTodo.mutateAsync({ projectId, title: values.title });
		reset();
	}

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="rounded-4xl border border-white/60 bg-white/85 p-3 shadow-[0_24px_80px_rgba(39,24,71,0.12)] backdrop-blur"
		>
			<div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
				<label className="sr-only" htmlFor="todo-title">
					Add a new todo
				</label>
				<input
					id="todo-title"
					type="text"
					disabled={!projectId}
					placeholder={
						projectId
							? `Add a task to ${projectName ?? "this project"}`
							: "Create a project first"
					}
					className="min-h-12 flex-1 rounded-[1.25rem] border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-orange-300 disabled:cursor-not-allowed disabled:bg-slate-100 sm:min-h-14 sm:px-5 sm:text-[15px]"
					{...register("title", {
						required: "Please enter a todo",
						validate: (value) =>
							value.trim().length > 0 || "Please enter a todo",
						maxLength: 120,
					})}
				/>
				<button
					type="submit"
					disabled={createTodo.isPending || !projectId}
					className="min-h-12 rounded-[1.25rem] bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:min-h-14 sm:px-6"
				>
					{createTodo.isPending ? "Adding..." : "Add task"}
				</button>
			</div>
			{errors.title ? (
				<p className="px-2 pt-2.5 text-sm font-medium text-rose-600">
					{errors.title.message}
				</p>
			) : null}
		</form>
	);
}
