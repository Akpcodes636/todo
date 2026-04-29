import {
	DndContext,
	PointerSensor,
	closestCenter,
	useSensor,
	useSensors,
	type DragEndEvent,
} from "@dnd-kit/core";
import {
	SortableContext,
	arrayMove,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import { formatDistanceToNow } from "date-fns";
import type { Todo } from "../../../types/todo";
import {
	useDeleteTodoMutation,
	useReorderTodosMutation,
	useUpdateTodoMutation,
} from "../todo.queries";
import { useState } from "react";

interface TodoListProps {
	todos: Todo[];
	isReorderEnabled: boolean;
	projectId: string | null;
}

function CheckIcon() {
	return (
		<svg
			viewBox="0 0 16 16"
			aria-hidden="true"
			className="h-3.5 w-3.5"
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="2"
		>
			<path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
		</svg>
	);
}

function DragHandle() {
	return (
		<svg
			viewBox="0 0 16 16"
			aria-hidden="true"
			className="h-3.5 w-3.5"
			fill="currentColor"
		>
			<circle cx="5.5" cy="5" r="1.2" />
			<circle cx="10.5" cy="5" r="1.2" />
			<circle cx="5.5" cy="11" r="1.2" />
			<circle cx="10.5" cy="11" r="1.2" />
			<circle cx="5.5" cy="8" r="1.2" />
			<circle cx="10.5" cy="8" r="1.2" />
		</svg>
	);
}

function TodoRow({
	todo,
	isReorderEnabled,
}: {
	todo: Todo;
	isReorderEnabled: boolean;
}) {
	const updateTodo = useUpdateTodoMutation();
	const deleteTodo = useDeleteTodoMutation();
	const [draftTitle, setDraftTitle] = useState(todo.title);
	const [isEditing, setIsEditing] = useState(false);

	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: todo.id });

	async function saveEdit() {
		const nextTitle = draftTitle.trim();
		if (!nextTitle || nextTitle === todo.title) {
			setDraftTitle(todo.title);
			setIsEditing(false);
			return;
		}
		await updateTodo.mutateAsync({
			id: todo.id,
			changes: { title: nextTitle },
		});
		setIsEditing(false);
	}

	return (
		<li
			ref={setNodeRef}
			style={{ transform: CSS.Transform.toString(transform), transition }}
			className={clsx(
				"group rounded-3xl border border-slate-200/80 bg-white p-3 shadow-[0_14px_40px_rgba(39,24,71,0.06)] transition sm:p-4",
				isDragging && "opacity-70 shadow-[0_24px_48px_rgba(39,24,71,0.18)]",
			)}
		>
			{/* Top row: checkbox + text content (full width, no competing elements) */}
			<div className="flex items-start gap-3">
				<button
					type="button"
					onClick={() =>
						updateTodo.mutate({
							id: todo.id,
							changes: { completed: !todo.completed },
						})
					}
					className={clsx(
						"mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition sm:mt-1 sm:h-6 sm:w-6",
						todo.completed
							? "border-emerald-500 bg-emerald-500 text-white"
							: "border-slate-300 bg-white text-transparent hover:border-slate-400",
					)}
					aria-label={
						todo.completed ? "Mark todo as incomplete" : "Mark todo as complete"
					}
				>
					<CheckIcon />
				</button>

				<div className="min-w-0 flex-1">
					{isEditing ? (
						<div className="space-y-2">
							<input
								value={draftTitle}
								onChange={(e) => setDraftTitle(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										void saveEdit();
									}
									if (e.key === "Escape") {
										setDraftTitle(todo.title);
										setIsEditing(false);
									}
								}}
								className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-400"
								autoFocus
							/>
							<div className="flex gap-2">
								<button
									type="button"
									onClick={() => void saveEdit()}
									className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800"
								>
									Save
								</button>
								<button
									type="button"
									onClick={() => {
										setDraftTitle(todo.title);
										setIsEditing(false);
									}}
									className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
								>
									Cancel
								</button>
							</div>
						</div>
					) : (
						<>
							<p
								className={clsx(
									"wrap-break-words text-sm font-semibold leading-snug text-slate-900 sm:text-base",
									todo.completed && "text-slate-400 line-through",
								)}
							>
								{todo.title}
							</p>
							<p className="mt-1 text-xs text-slate-400">
								Updated{" "}
								{formatDistanceToNow(new Date(todo.updatedAt), {
									addSuffix: true,
								})}
							</p>
						</>
					)}
				</div>
			</div>

			{/* Bottom action row — only shown when not editing */}
			{!isEditing && (
				<div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
					<button
						type="button"
						onClick={() => setIsEditing(true)}
						className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
					>
						Edit
					</button>
					<button
						type="button"
						{...(isReorderEnabled ? attributes : {})}
						{...(isReorderEnabled ? listeners : {})}
						className={clsx(
							"flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition",
							isReorderEnabled
								? "cursor-grab hover:border-slate-300 hover:bg-slate-50 active:cursor-grabbing"
								: "cursor-not-allowed opacity-30",
						)}
						aria-label={
							isReorderEnabled
								? "Drag to reorder task"
								: "Switch to all tasks to reorder"
						}
						disabled={!isReorderEnabled}
						title={
							isReorderEnabled
								? "Drag to reorder"
								: "Switch to All filter to reorder"
						}
					>
						<DragHandle />
						<span className="hidden sm:inline">Drag</span>
					</button>
					<button
						type="button"
						onClick={() => deleteTodo.mutate(todo.id)}
						className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
					>
						Delete
					</button>
				</div>
			)}
		</li>
	);
}

export function TodoList({
	todos,
	isReorderEnabled,
	projectId,
}: TodoListProps) {
	const reorderTodos = useReorderTodosMutation();
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
	);

	function onDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (!over || active.id === over.id || !projectId || !isReorderEnabled)
			return;
		const oldIndex = todos.findIndex((t) => t.id === active.id);
		const newIndex = todos.findIndex((t) => t.id === over.id);
		const reordered = arrayMove(todos, oldIndex, newIndex);
		reorderTodos.mutate({ projectId, ids: reordered.map((t) => t.id) });
	}

	return (
		<DndContext
			collisionDetection={closestCenter}
			sensors={sensors}
			onDragEnd={onDragEnd}
		>
			<SortableContext
				items={todos.map((t) => t.id)}
				strategy={verticalListSortingStrategy}
			>
				<ul className="space-y-2 sm:space-y-3">
					{todos.map((todo) => (
						<TodoRow
							key={todo.id}
							todo={todo}
							isReorderEnabled={isReorderEnabled}
						/>
					))}
				</ul>
			</SortableContext>
		</DndContext>
	);
}
