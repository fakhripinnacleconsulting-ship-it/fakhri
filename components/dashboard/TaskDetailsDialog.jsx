"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, Building2, Clock, Paperclip, ExternalLink, Copy } from "lucide-react";
import { toast } from "sonner";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { ScrollableContainer } from "@/components/ui/scrollable-container";

const TaskDetailsDialog = ({ open, onOpenChange, task }) => {
    if (!task) return null;

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case "high":
            case "urgent":
                return "destructive";
            case "medium":
                return "secondary";
            case "low":
                return "outline";
            default:
                return "secondary";
        }
    };

    const stripHtml = (html) => {
        return (html || '')
            .replace(/<[^>]*>?/gm, '') // Strip tags
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .trim();
    };

    const handleCopy = () => {
        const details = `Task: ${task.title || 'N/A'}
Status: ${task.status || 'N/A'}
Priority: ${task.priority || 'Normal'}
Client: ${task.client?.company || task.client?.name || 'N/A'}
Assignee: ${task.assignee?.name || task.owner || 'Unassigned'}
Due Date: ${formatDate(task.dueDate)}
Plan For Week: ${task.planForWeek || 'N/A'}

Description:
${stripHtml(task.description) || 'No description provided.'}`;
        navigator.clipboard.writeText(details);
        toast.success("Task details copied!");
    };



    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-2">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 mb-2">
                                <StatusBadge status={task.status} />
                                <Badge variant={getPriorityColor(task.priority)} className="capitalize">
                                    {task.priority || "Normal"} Priority
                                </Badge>
                            </div>
                            <DialogTitle className="text-xl font-bold leading-tight">
                                {task.title}
                            </DialogTitle>
                            <DialogDescription className="flex items-center gap-2 text-xs">
                                <span>ID: {task.taskId || task._id?.toString().slice(-6)}</span>
                                <span>•</span>
                                <span>Created {formatDate(task.createdAt)}</span>
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollableContainer className="flex-1 px-6 py-2">
                    <div className="space-y-6">
                        {/* Description */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-foreground/80">Description</h4>
                            <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 p-3 rounded-md border min-h-[60px]">
                                {stripHtml(task.description) || "No description provided."}
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client</h4>
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    <span>{task.client?.company || task.client?.name || "N/A"}</span>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assigned Admin</h4>
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span>{task.assignee?.name || "Unassigned"}</span>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Creator</h4>
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span>{task.owner || "N/A"}</span>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Due Date</h4>
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>{formatDate(task.dueDate)}</span>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plan For</h4>
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span>Week {task.planForWeek || "N/A"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Attachment Section */}
                        {task.attachment && task.attachment.url && (
                            <div className="space-y-2 pt-2">
                                <h4 className="text-sm font-semibold text-foreground/80">Attachment</h4>
                                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/40 transition-colors hover:bg-muted/60">
                                    <div className="flex items-center gap-3 overflow-hidden pl-1">
                                        <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <span className="text-sm font-medium truncate">{task.attachment.name || "Attached File"}</span>
                                    </div>
                                    <Button variant="secondary" size="sm" className="shrink-0" asChild>
                                        <a href={task.attachment.url} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            View / Download
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        )}

                    </div>
                </ScrollableContainer>

                <DialogFooter className="p-6 pt-4 border-t mt-auto flex justify-between">
                    <Button variant="outline" onClick={handleCopy} className="mr-auto">
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Details
                    </Button>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default TaskDetailsDialog;
