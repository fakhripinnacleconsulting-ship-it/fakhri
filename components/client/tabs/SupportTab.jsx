"use client";

import { useState, useEffect } from "react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, MessageSquarePlus, CheckCircle2, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFAQs } from "@/lib/actions/content";
import { submitClientFeedback } from "@/lib/actions/responses";
import { toast } from "sonner";



const SupportTab = ({ currentUser }) => {
    const [loading, setLoading] = useState(true);
    const [faqData, setFaqData] = useState([]);
    const [showFeedbackForm, setShowFeedbackForm] = useState(false);
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        subject: "",
        message: "",
        rating: 0
    });

    useEffect(() => {
        const loadFAQs = async () => {
            setLoading(true);
            try {
                // Fetch FAQs with 'dashboard' category or filter locally
                const faqs = await getFAQs();
                // Filter for dashboard related FAQs if category exists in model, 
                // but since the original code did it, we'll try to match it.
                // If model doesn't have categories field, we'll just show all.
                setFaqData(faqs.filter(f => !f.category || f.category.toLowerCase().includes('dashboard') || f.category.toLowerCase().includes('general')));
            } catch (error) {
                console.error("Error loading FAQs:", error);
            } finally {
                setLoading(false);
            }
        };

        loadFAQs();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRatingClick = (rating) => {
        setFormData(prev => ({ ...prev, rating }));
    };

    // ... (early imports)

    // ...

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const feedbackData = {
                client: currentUser._id,
                clientName: currentUser.name || "Unknown Client",
                rating: formData.rating,
                message: formData.message,
                subject: formData.subject
            };

            const result = await submitClientFeedback(feedbackData);

            if (result.success) {
                setFeedbackSubmitted(true);
                toast.success("Feedback submitted successfully");

                // Reset form after 3 seconds
                setTimeout(() => {
                    setFeedbackSubmitted(false);
                    setShowFeedbackForm(false);
                    setFormData({
                        subject: "",
                        message: "",
                        rating: 0
                    });
                }, 3000);
            } else {
                toast.error("Failed to submit feedback: " + result.error);
            }
        } catch (error) {
            console.error("Feedback error:", error);
            toast.error("An error occurred. Please try again.");
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-heading text-2xl font-bold mb-2">Feedback & Support</h1>
                <p className="text-muted-foreground">Find answers to common questions or share your feedback with us.</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* FAQ Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <HelpCircle className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-heading font-semibold">Frequently Asked Questions</h2>
                            <p className="text-sm text-muted-foreground">Quick answers to common queries</p>
                        </div>
                    </div>

                    <div className="bg-card rounded-xl border overflow-hidden p-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-4">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground">Loading FAQs...</p>
                            </div>
                        ) : faqData.length > 0 ? (
                            <Accordion type="single" collapsible className="w-full">
                                {faqData.map((faq, index) => (
                                    <AccordionItem key={faq._id || index} value={`item-${index}`}>
                                        <AccordionTrigger className="text-left font-medium text-sm">
                                            {faq.question}
                                        </AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground">
                                            {faq.answer}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                No FAQs found at the moment.
                            </div>
                        )}
                    </div>
                </div>

                {/* Feedback Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                            <MessageSquarePlus className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                            <h2 className="font-heading font-semibold">Share Your Feedback</h2>
                            <p className="text-sm text-muted-foreground">Help us improve your experience</p>
                        </div>
                    </div>

                    <div className="bg-card rounded-xl border p-6">
                        {!showFeedbackForm && !feedbackSubmitted ? (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                    <MessageSquarePlus className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="font-medium text-lg mb-2">We Value Your Feedback</h3>
                                <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                                    Your feedback helps us improve our services and provide you with a better experience.
                                </p>
                                <Button onClick={() => setShowFeedbackForm(true)} className="gap-2">
                                    <MessageSquarePlus className="h-4 w-4" />
                                    Give Feedback
                                </Button>
                            </div>
                        ) : feedbackSubmitted ? (
                            <div className="text-center py-8 animate-in fade-in duration-300">
                                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                                </div>
                                <h3 className="font-medium text-lg mb-2">Thank You!</h3>
                                <p className="text-muted-foreground text-sm">
                                    Your feedback has been submitted successfully.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-200">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-medium">Feedback Form</h3>
                                    <button
                                        type="button"
                                        onClick={() => setShowFeedbackForm(false)}
                                        className="p-1 rounded-lg hover:bg-accent transition-colors"
                                    >
                                        <X className="h-4 w-4 text-muted-foreground" />
                                    </button>
                                </div>

                                {/* Rating */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">How would you rate your experience?</label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => handleRatingClick(star)}
                                                className={`w-10 h-10 rounded-lg border-2 transition-all ${formData.rating >= star
                                                    ? 'border-yellow-400 bg-yellow-400/20 text-yellow-600'
                                                    : 'border-border hover:border-yellow-400/50'
                                                    }`}
                                            >
                                                {star}
                                            </button>
                                        ))}
                                    </div>
                                </div>



                                {/* Subject */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Subject</label>
                                    <input
                                        type="text"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleInputChange}
                                        placeholder="Brief summary of your feedback"
                                        className="w-full px-3 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        required
                                    />
                                </div>

                                {/* Message */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Message</label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleInputChange}
                                        placeholder="Please share your detailed feedback..."
                                        rows={4}
                                        className="w-full px-3 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                                        required
                                    />
                                </div>

                                {/* Submit Button */}
                                <Button type="submit" className="w-full gap-2">
                                    <Send className="h-4 w-4" />
                                    Submit Feedback
                                </Button>
                            </form>
                        )}
                    </div>

                    {/* Additional Help & Contact Departments */}
                    <div className="bg-card rounded-xl border p-6">
                        <h3 className="font-heading font-semibold text-lg mb-4">Contact Departments</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                            <div>
                                <span className="font-medium text-foreground block">Support</span>
                                <a href="mailto:support@fakhriitservices.com" className="text-primary hover:underline transition-colors">support@fakhriitservices.com</a>
                            </div>
                            <div>
                                <span className="font-medium text-foreground block">Sales</span>
                                <a href="mailto:sales@fakhriitservices.com" className="text-primary hover:underline transition-colors">sales@fakhriitservices.com</a>
                            </div>
                            <div>
                                <span className="font-medium text-foreground block">Finance</span>
                                <a href="mailto:finance@fakhriitservices.com" className="text-primary hover:underline transition-colors">finance@fakhriitservices.com</a>
                            </div>
                            <div>
                                <span className="font-medium text-foreground block">Escalations</span>
                                <a href="mailto:escalations@fakhriitservices.com" className="text-primary hover:underline transition-colors">escalations@fakhriitservices.com</a>
                            </div>
                            <div>
                                <span className="font-medium text-foreground block">Feedback</span>
                                <a href="mailto:feedback@fakhriitservices.com" className="text-primary hover:underline transition-colors">feedback@fakhriitservices.com</a>
                            </div>
                            <div>
                                <span className="font-medium text-foreground block">General Inquiry</span>
                                <a href="mailto:info@fakhriitservices.com" className="text-primary hover:underline transition-colors">info@fakhriitservices.com</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupportTab;
