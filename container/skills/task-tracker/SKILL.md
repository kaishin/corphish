---
name: task-tracker
description: Track tasks and their statuses (todo, blocked, paused, ongoing, done). Use to manage current work items. The database is stored in the skill folder.
allowed-tools: Bash(task-tracker:*)
---

# Task Tracker

Track tasks with statuses: todo, blocked, paused, ongoing, done.

## Usage

```bash
task-tracker list                      # List all tasks
task-tracker add "Task title"          # Add a new task (default: todo)
task-tracker status "Task title" ongoing   # Update task status
task-tracker done "Task title"         # Mark task as done
task-tracker delete "Task title"        # Delete a task
task-tracker clear                      # Delete all tasks
```

## Status Options

- **todo** — Task needs to be done
- **ongoing** — Task is actively being worked on
- **blocked** — Task cannot proceed
- **paused** — Task is on hold
- **done** — Task is completed

## Examples

```bash
task-tracker add "Fix login bug"
task-tracker status "Fix login bug" ongoing
task-tracker list
task-tracker add "API migration"
task-tracker status "API migration" blocked
task-tracker status "Fix login bug" done
```
