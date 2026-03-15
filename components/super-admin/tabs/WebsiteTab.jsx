"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Edit, Trash2, Save, X, ChevronRight, FileText, MessageSquare, HelpCircle, Briefcase, Building, Users, DollarSign, List, Shield, Eye, RefreshCw, Check, GripVertical, Loader2, ChevronsUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import dynamic from 'next/dynamic';
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';
import { ImagePicker } from "@/components/ui/image-picker";
import { ScrollableContainer } from "@/components/ui/scrollable-container";
import { normalizePeriod, formatINR, cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const CreatableCombobox = ({ value, onChange, options, placeholder, emptyText = "No option found." }) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    const handleSelect = (option) => {
        onChange(option);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal px-3"
                >
                    {value || <span className="text-muted-foreground">{placeholder}</span>}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder={placeholder}
                        value={query}
                        onValueChange={setQuery}
                    />
                    <CommandList>
                        <CommandEmpty>
                            <div className="p-2 text-center text-sm text-muted-foreground">
                                {query.trim().length > 0 ? (
                                    <div
                                        className="cursor-pointer hover:underline text-primary"
                                        onClick={() => {
                                            onChange(query);
                                            setOpen(false);
                                        }}
                                    >
                                        Create "{query}"
                                    </div>
                                ) : emptyText}
                            </div>
                        </CommandEmpty>
                        <CommandGroup>
                            {options.filter(opt => opt.toLowerCase().includes(query.toLowerCase())).map((option) => (
                                <CommandItem
                                    key={option}
                                    value={option}
                                    onSelect={() => handleSelect(option)}
                                    className="capitalize"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === option ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

// Import Server Actions
import {
    getCompanyData, updateCompanyData,
    getTeamMembers, upsertTeamMember, deleteTeamMember,
    getPricingPlans, upsertPricingPlan, deletePricingPlan,
    getPricingFeatures, upsertPricingFeature, deletePricingFeature,
    getMilestones, upsertMilestone, deleteMilestone,
    getServices, upsertService, deleteService,
    getCatalogServices, upsertCatalogService, deleteCatalogService,
    getTestimonials, upsertTestimonial, deleteTestimonial,
    getFAQs, upsertFAQ, deleteFAQ,
    getJobs, upsertJob, deleteJob,
    getWebPage, upsertWebPage
} from "@/lib/actions/content";
import { getBlogPosts, upsertBlogPost, deleteBlogPost } from "@/lib/actions/blog";

export default function WebsiteTab() {
    const router = useRouter();
    const [activeCategory, setActiveCategory] = useState("Company");
    const [loading, setLoading] = useState(true);

    // Data States
    const [companyInfo, setCompanyInfo] = useState(null);
    const [members, setMembers] = useState([]);
    const [pricingPlans, setPricingPlans] = useState([]);
    const [pricingFeatures, setPricingFeatures] = useState([]);
    const [services, setServices] = useState([]);
    const [catalog, setCatalog] = useState([]);
    const [testimonials, setTestimonials] = useState([]);
    const [faqs, setFaqs] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [milestones, setMilestones] = useState([]);
    const [posts, setPosts] = useState([]);

    const loadAllData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [
                companyData,
                teamData,
                plansData,
                pricingFeaturesData,
                servicesData,
                catalogData,
                testimonialData,
                faqsData,
                jobsData,
                milestonesData,
                blogData
            ] = await Promise.all([
                getCompanyData(),
                getTeamMembers(),
                getPricingPlans(),
                getPricingFeatures(),
                getServices(),
                getCatalogServices(),
                getTestimonials(),
                getFAQs(),
                getJobs(),
                getMilestones(),
                getBlogPosts()
            ]);

            setCompanyInfo(companyData || {});
            setMembers(teamData || []);
            setPricingPlans(plansData || []);
            setPricingFeatures(pricingFeaturesData || []);
            setServices(servicesData || []);
            setCatalog(catalogData || []);

            // Add default values for testimonials if needed
            const processedTestimonials = (testimonialData || []).map(t => ({
                ...t,
                rating: t.rating || 5,
                author: t.author || { name: "Anonymous", role: "Client", company: "", handle: "", image: "" },
                metric: t.metric || { label: "", value: "" }
            }));
            setTestimonials(processedTestimonials);

            // Ensure FAQ categories exist
            const processedFaqs = (faqsData || []).map(f => ({
                ...f,
                categories: f.categories || { home: false, pricing: false, dashboard: false }
            }));
            setFaqs(processedFaqs);

            setJobs(jobsData || []);
            setMilestones(milestonesData || []);
            setPosts(blogData?.posts || []);

        } catch (error) {
            console.error("Failed to load CMS data:", error);
            if (!silent) toast.error("Failed to load some content data");
        } finally {
            setLoading(false);
        }
    }, []);

    const refreshCategoryData = useCallback(async () => {
        toast.loading(`Refreshing ${activeCategory}...`, { id: "refresh-cms" });
        try {
            switch (activeCategory) {
                case "Company":
                    const company = await getCompanyData();
                    setCompanyInfo(company);
                    break;
                case "Team":
                    const team = await getTeamMembers();
                    setMembers(team);
                    break;
                case "Pricing":
                    const prices = await getPricingPlans();
                    const features = await getPricingFeatures();
                    setPricingPlans(prices);
                    setPricingFeatures(features);
                    break;
                case "Features":
                    const fts = await getPricingFeatures();
                    setPricingFeatures(fts);
                    break;
                case "Services":
                    const srvs = await getServices();
                    setServices(srvs);
                    break;
                case "Catalog":
                    const cat = await getCatalogServices();
                    setCatalog(cat);
                    break;
                case "Blogs":
                    const blog = await getBlogPosts();
                    setPosts(blog?.posts || []);
                    break;
                case "Testimonials":
                    const tests = await getTestimonials();
                    const processed = (tests || []).map(t => ({
                        ...t,
                        rating: t.rating || 5,
                        author: t.author || { name: "Anonymous", role: "Client", company: "", handle: "", image: "" },
                        metric: t.metric || { label: "", value: "" }
                    }));
                    setTestimonials(processed);
                    break;
                case "FAQs":
                    const faqsData = await getFAQs();
                    const processedFaqs = (faqsData || []).map(f => ({
                        ...f,
                        categories: f.categories || { home: false, pricing: false, dashboard: false }
                    }));
                    setFaqs(processedFaqs);
                    break;
                case "Jobs":
                    const roles = await getJobs();
                    setJobs(roles);
                    break;
                case "Milestones":
                    const ms = await getMilestones();
                    setMilestones(ms);
                    break;
                case "Legal":
                    // Handled within LegalManager but if needed we can refresh here
                    break;
            }
            toast.success(`${activeCategory} data refreshed`, { id: "refresh-cms" });
        } catch (error) {
            toast.error(`Failed to refresh ${activeCategory}`, { id: "refresh-cms" });
        }
    }, [activeCategory]);

    useEffect(() => {
        loadAllData();
    }, [loadAllData]);

    const categories = useMemo(() => [
        { id: "Company", label: "Company Profile", icon: Building, description: "Manage brand profile, contact info, and core story." },
        { id: "Team", label: "Our Team", icon: Users, description: "Showcase the brilliant minds driving your company's success." },
        { id: "Pricing", label: "Our Plans", icon: DollarSign, description: "Configure plans and pricing tiers." },
        { id: "Features", label: "Plan Features", icon: List, description: "Manage global feature library for all pricing plans." },
        { id: "Services", label: "Key Services", icon: Briefcase, description: "Highlight primary services with features and key benefits." },
        { id: "Catalog", label: "Service Catalog", icon: List, description: "Define detailed service offerings and specific item pricing." },
        { id: "Blogs", label: "Blog & News", icon: FileText, description: "Publish articles, industry news, and expert perspectives." },
        { id: "Testimonials", label: "Client Love", icon: MessageSquare, description: "Display social proof and client success stories." },
        { id: "FAQs", label: "Knowledge Base", icon: HelpCircle, description: "Provide answers to commonly asked customer questions." },
        { id: "Jobs", label: "Open Positions", icon: Shield, description: "Manage company vacancies and career opportunities." },
        { id: "Milestones", label: "Milestones", icon: ChevronRight, description: "Track and showcase key company achievements over time." },
        { id: "Legal", label: "Legal Center", icon: Shield, description: "Manage terms of service, privacy policy and legal pages." },
    ], []);

    const activeCategoryData = useMemo(() => categories.find(c => c.id === activeCategory), [categories, activeCategory]);

    if (loading) {
        return (
            <div className="h-96 flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">Loading website content...</p>
            </div>
        );
    }



    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-transparent to-transparent p-6 rounded-2xl border border-primary/10 shadow-sm shadow-primary/5">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                        {activeCategoryData && <activeCategoryData.icon className="h-6 w-6" />}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
                            {activeCategoryData?.label || "Website CMS"}
                        </h2>
                        <p className="text-sm text-muted-foreground font-medium">
                            {categories.find(c => c.id === activeCategory)?.description || "Manage all public-facing content and data with full control."}
                        </p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className="px-3 py-1 bg-background/50 backdrop-blur-sm border-primary/20 text-primary font-bold">
                        CMS PORTAL
                    </Badge>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold opacity-60">System Version 2.4.0</span>
                </div>
            </div>

            <div className="bg-card/50 p-1.5 rounded-xl border shadow-sm sticky top-0 z-40 backdrop-blur-md">
                <div className="flex overflow-x-auto gap-1 no-scrollbar scroll-smooth p-1">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap ${activeCategory === cat.id
                                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                                }`}
                        >
                            <cat.icon className={`h-4 w-4 transition-transform ${activeCategory === cat.id ? "scale-110" : ""}`} />
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="min-h-[500px]">
                {activeCategory === "Company" && <CompanyManager data={companyInfo} onUpdate={setCompanyInfo} refreshData={refreshCategoryData} />}
                {activeCategory === "Team" && <TeamManager data={members} onUpdate={setMembers} refreshData={refreshCategoryData} />}
                {activeCategory === "Pricing" && <PricingManager data={pricingPlans} featuresData={pricingFeatures} onUpdate={setPricingPlans} refreshData={refreshCategoryData} />}
                {activeCategory === "Features" && <FeatureManager data={pricingFeatures} plansData={pricingPlans} onUpdate={setPricingFeatures} refreshData={refreshCategoryData} onPlansUpdate={setPricingPlans} />}
                {activeCategory === "Services" && <ServiceManager data={services} onUpdate={setServices} refreshData={refreshCategoryData} />}
                {activeCategory === "Catalog" && <CatalogManager data={catalog} onUpdate={setCatalog} refreshData={refreshCategoryData} />}
                {activeCategory === "Blogs" && <BlogManager data={posts} onUpdate={setPosts} refreshData={refreshCategoryData} />}
                {activeCategory === "Milestones" && <MilestoneManager data={milestones} onUpdate={setMilestones} refreshData={refreshCategoryData} />}
                {activeCategory === "Testimonials" && <TestimonialManager data={testimonials} onUpdate={setTestimonials} refreshData={refreshCategoryData} />}
                {activeCategory === "FAQs" && <FAQManager data={faqs} onUpdate={setFaqs} refreshData={refreshCategoryData} />}
                {activeCategory === "Jobs" && <JobManager data={jobs} onUpdate={setJobs} refreshData={refreshCategoryData} />}
                {activeCategory === "Legal" && <LegalManager />}
            </div>
        </div>
    );
}

// Helper for Array Inputs (Tags, Features, etc.)
function ArrayInput({ values = [], onChange, label, placeholder }) {
    const safeValues = Array.isArray(values) ? values : [];
    const handleAdd = () => onChange([...safeValues, ""]);
    const handleChange = (index, value) => {
        const newValues = [...safeValues];
        newValues[index] = value;
        onChange(newValues);
    };
    const handleRemove = (index) => {
        const newValues = safeValues.filter((_, i) => i !== index);
        onChange(newValues);
    };

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            {safeValues.map((val, index) => (
                <div key={index} className="flex gap-2">
                    <Input value={val} onChange={(e) => handleChange(index, e.target.value)} placeholder={placeholder} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemove(index)}><X className="h-4 w-4" /></Button>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={handleAdd} className="mt-1"><Plus className="h-3 w-3 mr-2" /> Add {label}</Button>
        </div>
    );
}

// Helper for Object Array Inputs (Stats, Badges, etc.)
function ObjectArrayInput({ values = [], onChange, label, fields }) {
    const safeValues = Array.isArray(values) ? values : [];
    const handleAdd = () => {
        const newItem = fields.reduce((acc, field) => ({ ...acc, [field.name]: "" }), {});
        onChange([...safeValues, newItem]);
    };

    const handleChange = (index, fieldName, value) => {
        const newValues = [...safeValues];
        newValues[index] = { ...newValues[index], [fieldName]: value };
        onChange(newValues);
    };

    const handleRemove = (index) => {
        const newValues = safeValues.filter((_, i) => i !== index);
        onChange(newValues);
    };

    return (
        <div className="space-y-4 border p-4 rounded-lg bg-muted/20">
            <div className="flex items-center justify-between mb-2">
                <Label className="text-base font-semibold">{label}</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
                    <Plus className="h-4 w-4 mr-2" /> Add {label.replace(/s$/i, '')}
                </Button>
            </div>
            {safeValues.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4 bg-background/50 rounded-md border border-dashed">
                    No {label.toLowerCase()} added yet.
                </p>
            )}
            <div className="grid gap-4">
                {safeValues.map((val, index) => (
                    <div key={index} className="space-y-3 p-4 border rounded-md bg-background relative shadow-sm">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemove(index)}
                            className="absolute right-2 top-2 text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-7"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                            {fields.map((field) => (
                                <div key={field.name} className={`${field.fullWidth ? 'md:col-span-2' : ''} space-y-1`}>
                                    <Label className="text-xs font-medium text-muted-foreground">{field.label}</Label>
                                    {field.type === 'textarea' ? (
                                        <Textarea
                                            value={val[field.name] || ""}
                                            onChange={(e) => handleChange(index, field.name, e.target.value)}
                                            placeholder={field.placeholder}
                                            rows={2}
                                            className="text-sm"
                                        />
                                    ) : field.type === 'image' ? (
                                        <ImagePicker
                                            name={`${field.name}-${index}`}
                                            label={field.label}
                                            value={val[field.name] || ""}
                                            onChange={(v) => handleChange(index, field.name, v)}
                                        />
                                    ) : (
                                        <Input
                                            value={val[field.name] || ""}
                                            onChange={(e) => handleChange(index, field.name, e.target.value)}
                                            placeholder={field.placeholder}
                                            className="text-sm"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// 1. Company Manager
function CompanyManager({ data, onUpdate, refreshData }) {
    const [formData, setFormData] = useState(data || {
        name: "", tagline: "", established: "", description: "", logo: "",
        contact: { phone: { primary: "", secondary: "" }, email: { info: "", support: "" }, address: { full: "" }, social: { linkedin: "", instagram: "" } },
        mission: "", vision: "", story: { title: "", content: "", highlights: [] },
        badges: [], stats: [], culture: { title: "", values: [] }, partners: []
    });

    useEffect(() => {
        if (data && Object.keys(data).length > 0) {
            setFormData({
                ...data,
                story: data.story || { title: "", content: "", highlights: [] },
                badges: data.badges || [],
                stats: data.stats || [],
                culture: data.culture || { title: "", values: [] },
                partners: data.partners || []
            });
        }
    }, [data]);

    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (section, field, value) => {
        if (section) {
            setFormData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updated = await updateCompanyData(formData);
            if (updated) {
                onUpdate(updated);
                toast.success("Company information updated successfully");
            } else {
                toast.error("Failed to update company information");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-4 rounded-lg border shadow-sm sticky top-16 z-30">
                <div>
                    <h3 className="text-lg font-semibold">Company Profile</h3>
                    <p className="text-sm text-muted-foreground">Manage your brand identity, contact info, and core messaging.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => refreshData()} title="Refresh Data">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>General Info</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <ImagePicker
                                name="logo"
                                label="Company Logo"
                                value={formData.logo}
                                onChange={(val) => handleChange(null, 'logo', val)}
                            />
                        </div>
                        <div className="grid gap-2"><Label>Company Name</Label><Input value={formData.name} onChange={(e) => handleChange(null, 'name', e.target.value)} /></div>
                        <div className="grid gap-2"><Label>Tagline</Label><Input value={formData.tagline} onChange={(e) => handleChange(null, 'tagline', e.target.value)} /></div>
                        <div className="grid gap-2"><Label>Established Year</Label><Input value={formData.established} onChange={(e) => handleChange(null, 'established', e.target.value)} /></div>
                        <div className="grid gap-2"><Label>Description</Label><Textarea value={formData.description} onChange={(e) => handleChange(null, 'description', e.target.value)} rows={4} /></div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Contact Details</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2"><Label>Primary Phone</Label><Input value={formData.contact?.phone?.primary} onChange={(e) => handleChange('contact', 'phone', { ...formData.contact.phone, primary: e.target.value })} /></div>
                            <div className="grid gap-2"><Label>Secondary Phone</Label><Input value={formData.contact?.phone?.secondary} onChange={(e) => handleChange('contact', 'phone', { ...formData.contact.phone, secondary: e.target.value })} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2"><Label>Info Email</Label><Input value={formData.contact?.email?.info} onChange={(e) => handleChange('contact', 'email', { ...formData.contact.email, info: e.target.value })} /></div>
                            <div className="grid gap-2"><Label>Support Email</Label><Input value={formData.contact?.email?.support} onChange={(e) => handleChange('contact', 'email', { ...formData.contact.email, support: e.target.value })} /></div>
                        </div>
                        <div className="grid gap-2"><Label>Full Address</Label><Textarea value={formData.contact?.address?.full} onChange={(e) => handleChange('contact', 'address', { ...formData.contact.address, full: e.target.value })} /></div>
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                            <div className="grid gap-2"><Label>LinkedIn</Label><Input value={formData.contact?.social?.linkedin} onChange={(e) => handleChange('contact', 'social', { ...formData.contact.social, linkedin: e.target.value })} /></div>
                            <div className="grid gap-2"><Label>Instagram</Label><Input value={formData.contact?.social?.instagram} onChange={(e) => handleChange('contact', 'social', { ...formData.contact.social, instagram: e.target.value })} /></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader><CardTitle>Trust & Authority (Badges & Stats)</CardTitle></CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                        <ObjectArrayInput
                            label="Trust Badges"
                            values={formData.badges}
                            onChange={(val) => handleChange(null, 'badges', val)}
                            fields={[
                                { name: 'title', label: 'Badge Title', placeholder: 'e.g. Amazon Gold Partner' },
                                { name: 'subtitle', label: 'Subtitle/Detail', placeholder: 'e.g. Strategic Provider Network' },
                            ]}
                        />
                        <ObjectArrayInput
                            label="Company Stats"
                            values={formData.stats}
                            onChange={(val) => handleChange(null, 'stats', val)}
                            fields={[
                                { name: 'value', label: 'Value', placeholder: 'e.g. 500+' },
                                { name: 'label', label: 'Label', placeholder: 'e.g. Happy Clients' },
                                { name: 'description', label: 'Description', placeholder: 'e.g. Trusted by leading brands', fullWidth: true },
                            ]}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Mission & Vision</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2"><Label>Mission</Label><Textarea value={formData.mission} onChange={(e) => handleChange(null, 'mission', e.target.value)} rows={3} /></div>
                        <div className="grid gap-2"><Label>Vision</Label><Textarea value={formData.vision} onChange={(e) => handleChange(null, 'vision', e.target.value)} rows={3} /></div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Our Story</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2"><Label>Story Title</Label><Input value={formData.story?.title} onChange={(e) => handleChange('story', 'title', e.target.value)} /></div>
                        <div className="grid gap-2"><Label>Story Content</Label><Textarea value={formData.story?.content} onChange={(e) => handleChange('story', 'content', e.target.value)} rows={4} /></div>
                        <ArrayInput
                            label="Story Highlights"
                            values={formData.story?.highlights || []}
                            onChange={(val) => handleChange('story', 'highlights', val)}
                            placeholder="Add a key highlight..."
                        />
                    </CardContent>
                </Card>

                {/* <Card className="md:col-span-2">
                    <CardHeader><CardTitle>Culture & Values</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-2"><Label>Section Title</Label><Input value={formData.culture?.title} onChange={(e) => handleChange('culture', 'title', e.target.value)} placeholder="e.g. Our Core Values" className="max-w-md" /></div>
                        <ObjectArrayInput
                            label="Core Values"
                            values={formData.culture?.values}
                            onChange={(val) => handleChange('culture', 'values', val)}
                            fields={[
                                { name: 'title', label: 'Value Name', placeholder: 'e.g. Excellence' },
                                { name: 'description', label: 'Description', placeholder: 'e.g. We strive for perfection...', fullWidth: true },
                            ]}
                        />
                    </CardContent>
                </Card> */}

                <Card className="md:col-span-2">
                    <CardHeader><CardTitle>Partners & Brands</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <ObjectArrayInput
                            label="Partners"
                            values={formData.partners}
                            onChange={(val) => handleChange(null, 'partners', val)}
                            fields={[
                                { name: 'name', label: 'Partner/Brand Name', placeholder: 'e.g. Google' },
                                { name: 'logo', label: 'Company Logo', type: 'image', fullWidth: true }
                            ]}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// 2. Team Manager
// 2. Team Manager
function TeamManager({ data, onUpdate, refreshData }) {
    const [members, setMembers] = useState(Array.isArray(data) ? data : []);

    useEffect(() => {
        if (Array.isArray(data)) setMembers(data);
    }, [data]);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentMember, setCurrentMember] = useState(null);
    const [isViewMode, setIsViewMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const handleDelete = async (id) => {
        if (confirm("Delete team member?")) {
            setIsLoading(true);
            try {
                const res = await deleteTeamMember(id);
                if (res.success) {
                    const updated = members.filter(m => m._id !== id && m.id !== id);
                    setMembers(updated);
                    onUpdate(updated);
                    toast.success("Deleted");
                } else {
                    toast.error("Failed to delete");
                }
            } catch (error) {
                toast.error("Error deleting member");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.target);

        const newMember = {
            id: currentMember ? (currentMember._id || currentMember.id) : undefined,
            name: formData.get("name"),
            role: formData.get("role"),
            category: formData.get("category"),
            email: formData.get("email"),
            image: formData.get("image") || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
            order: Number(formData.get("order")) || members.length + 1
        };

        try {
            const savedMember = await upsertTeamMember(newMember);
            if (savedMember) {
                const updatedMembers = members.some(m => m._id === savedMember._id || m.id === savedMember.id)
                    ? members.map(m => (m._id === savedMember._id || m.id === savedMember.id) ? savedMember : m)
                    : [...members, savedMember];

                setMembers(updatedMembers);
                onUpdate(updatedMembers);
                toast.success(currentMember ? "Updated" : "Added");
                setIsDialogOpen(false);
                if (refreshData) refreshData(true);
            } else {
                toast.error("Failed to save team member");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <ChevronsUpDown className="ml-2 h-3 w-3 opacity-40 shrink-0" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="ml-2 h-3 w-3 text-primary shrink-0" />
            : <ArrowDown className="ml-2 h-3 w-3 text-primary shrink-0" />;
    };

    const filteredMembers = useMemo(() => {
        return members.filter(m =>
            m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.category?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [members, searchQuery]);

    const sortedMembers = useMemo(() => {
        return [...filteredMembers].sort((a, b) => {
            let aVal = a[sortConfig.key] || "";
            let bVal = b[sortConfig.key] || "";
            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredMembers, sortConfig]);

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/30 p-4 rounded-xl border border-dashed">
                <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search team by name, role or category..."
                        className="pl-10 h-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="outline" size="sm" onClick={() => refreshData()} title="Refresh Data" className="h-10">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    <Button onClick={() => { setCurrentMember(null); setIsViewMode(false); setIsDialogOpen(true); }} className="h-10 bg-primary shadow-lg shadow-primary/20">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Member
                    </Button>
                </div>
            </div>
            {/* ... (keep the rest of the table) */}
            <div className="rounded-md border bg-card overflow-hidden">
                <ScrollableContainer maxHeight="50vh">
                    <Table wrapperClassName="overflow-visible">
                        <TableHeader className="sticky top-0 z-10 bg-card shadow-sm border-b">
                            <TableRow>
                                <TableHead>
                                    <button onClick={() => handleSort('name')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                        Name {getSortIcon('name')}
                                    </button>
                                </TableHead>
                                <TableHead>
                                    <button onClick={() => handleSort('role')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                        Role {getSortIcon('role')}
                                    </button>
                                </TableHead>
                                <TableHead>
                                    <button onClick={() => handleSort('category')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                        Category {getSortIcon('category')}
                                    </button>
                                </TableHead>
                                <TableHead className="text-right font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedMembers.map((m, index) => (
                                <TableRow key={`${m._id || m.id || 'member'}-${index}`}>
                                    <TableCell className="font-medium flex items-center gap-2 capitalize">
                                        <img src={m.image} className="w-8 h-8 rounded-full object-cover" alt={m.name} />
                                        {m.name}
                                    </TableCell>
                                    <TableCell className="capitalize">{m.role}</TableCell>
                                    <TableCell><Badge variant="outline">{m.category}</Badge></TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => { setCurrentMember(m); setIsViewMode(true); setIsDialogOpen(true); }}><Eye className="w-4 h-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => { setCurrentMember(m); setIsViewMode(false); setIsDialogOpen(true); }}><Edit className="w-4 h-4" /></Button>
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(m._id || m.id)}><Trash2 className="w-4 h-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollableContainer>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-h-[85vh] flex flex-col p-0 gap-0">
                    <DialogHeader className="p-6 pb-2"><DialogTitle>{isViewMode ? "View Member" : currentMember ? "Edit Member" : "Add Member"}</DialogTitle></DialogHeader>
                    <ScrollableContainer className="flex-1 p-6 pt-2">
                        {isViewMode ? (
                            <div className="space-y-4">
                                <div className="flex justify-center"><img src={currentMember?.image || undefined} className="w-24 h-24 rounded-full object-cover" /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><Label>Name</Label><p className="capitalize">{currentMember?.name}</p></div><div><Label>Role</Label><p className="capitalize">{currentMember?.role}</p></div>
                                    <div><Label>Category</Label><Badge>{currentMember?.category}</Badge></div><div><Label>Email</Label><p>{currentMember?.email}</p></div>
                                    {/* <div className="col-span-2"><Label>Description</Label><p className="text-sm text-muted-foreground">{currentMember?.description}</p></div> */}
                                </div>
                            </div>
                        ) : (
                            <form id="team-manager-form" onSubmit={handleSave} className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="grid gap-2"><Label>Name</Label><Input name="name" defaultValue={currentMember?.name} required /></div>
                                    <div className="grid gap-2"><Label>Role</Label><Input name="role" defaultValue={currentMember?.role} required /></div>
                                </div>
                                <div className="grid gap-2"><Label>Category</Label><Select name="category" defaultValue={currentMember?.category || "Core Leadership"}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Core Leadership">Core Leadership</SelectItem><SelectItem value="Senior Management">Senior Management</SelectItem><SelectItem value="Rising Stars">Rising Stars</SelectItem></SelectContent></Select></div>
                                <div className="grid gap-2"><Label>Email</Label><Input name="email" defaultValue={currentMember?.email} /></div>
                                <div className="grid gap-2">
                                    <ImagePicker name="image" label="Profile Image" value={currentMember?.image} />
                                </div>
                                {/* <div className="grid gap-2"><Label>Description</Label><Textarea name="description" defaultValue={currentMember?.description} /></div> */}
                                <div className="grid gap-2"><Label>Order</Label><Input type="number" name="order" defaultValue={currentMember?.order} /></div>
                            </form>
                        )}
                    </ScrollableContainer>
                    {!isViewMode && (
                        <DialogFooter className="p-6 pt-2 border-t">
                            <Button type="submit" form="team-manager-form" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save
                            </Button>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

// 3. Pricing Manager
// 2.5 Feature Manager
function FeatureManager({ data, plansData, onUpdate, refreshData, onPlansUpdate }) {
    const [features, setFeatures] = useState(Array.isArray(data) ? data : []);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentFeature, setCurrentFeature] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedPlans, setSelectedPlans] = useState([]); // Array of plan IDs where this feature is included

    useEffect(() => {
        if (Array.isArray(data)) setFeatures(data);
    }, [data]);

    useEffect(() => {
        if (currentFeature) {
            // Find which plans have this feature included
            const activePlans = (plansData || []).filter(plan =>
                plan.features?.some(f => f.text === currentFeature.text && f.included)
            ).map(p => p._id || p.id);
            setSelectedPlans(activePlans);
        } else {
            setSelectedPlans([]);
        }
    }, [currentFeature, plansData]);

    const handleSave = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.target);

        const newText = formData.get("text")?.trim();
        if (!newText) {
            toast.error("Feature text is required");
            setIsLoading(false);
            return;
        }

        const featureObj = {
            id: currentFeature?._id || currentFeature?.id,
            text: newText,
            description: formData.get("description"),
            order: Number(formData.get("order")) || 0
        };

        const oldText = currentFeature?.text;

        try {
            const savedFeature = await upsertPricingFeature(featureObj);
            if (savedFeature) {
                // Update plans association
                const planUpdates = (plansData || []).map(async (plan) => {
                    const isSelected = selectedPlans.includes(plan._id || plan.id);
                    
                    // Find by current text OR old text (if renamed)
                    const existingIndex = (plan.features || []).findIndex(f => 
                        f.text === newText || (oldText && f.text === oldText)
                    );

                    let newFeatures = [...(plan.features || [])];
                    if (existingIndex > -1) {
                        // Update existing entry with new name and status
                        newFeatures[existingIndex] = { 
                            ...newFeatures[existingIndex], 
                            text: newText, 
                            included: isSelected 
                        };
                    } else if (isSelected) {
                        // Add new entry if it's a new feature and selected
                        newFeatures.push({ text: newText, value: "", included: true });
                    }

                    // For performance, you might want to filter out empty/duplicate features here too
                    newFeatures = newFeatures.filter((f, i, self) => 
                        f.text && f.text.trim().length > 0 && 
                        self.findIndex(t => t.text === f.text) === i
                    );

                    // Update plan in DB
                    return await upsertPricingPlan({ ...plan, features: newFeatures, id: plan._id || plan.id });
                });

                await Promise.all(planUpdates);

                toast.success("Feature and Plan associations updated");
                setIsDialogOpen(false);
                refreshData();
                if (onPlansUpdate) {
                    const updatedPlans = await getPricingPlans();
                    onPlansUpdate(updatedPlans);
                }
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to save feature");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure? This will not remove the feature text from existing plans but will delete it from the library.")) return;
        try {
            await deletePricingFeature(id);
            toast.success("Feature deleted from library");
            refreshData();
        } catch (error) {
            toast.error("Failed to delete feature");
        }
    };

    const filteredFeatures = features.filter(f => f.text.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/30 p-4 rounded-xl border border-dashed text-sm">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                        <List className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="font-bold">Global Feature Library</p>
                        <p className="text-muted-foreground text-xs uppercase tracking-tight">Manage standard offerings across plans</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => refreshData()} className="h-9">
                        <RefreshCw className="mr-2 h-3.5 w-3.5" /> Sync
                    </Button>
                    <Button onClick={() => { setCurrentFeature(null); setIsDialogOpen(true); }} className="h-9">
                        <Plus className="mr-2 h-4 w-4" /> Add Feature
                    </Button>
                </div>
            </div>

            <div className="flex items-center relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search feature library..."
                    className="pl-10 h-10 ring-offset-background focus-visible:ring-primary/10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow>
                            <TableHead className="w-16">Rank</TableHead>
                            <TableHead>Feature Identification</TableHead>
                            <TableHead>Context/Description</TableHead>
                            <TableHead>Active Plans</TableHead>
                            <TableHead className="text-right">Manage</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredFeatures.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                                    No global features configured yet.
                                </TableCell>
                            </TableRow>
                        )}
                        {filteredFeatures.map((feature) => {
                            const activeIn = (plansData || []).filter(p => p.features?.some(f => f.text === feature.text && f.included));
                            return (
                                <TableRow key={feature._id || feature.id} className="group transition-colors">
                                    <TableCell className="font-mono text-[10px] text-muted-foreground">#{feature.order}</TableCell>
                                    <TableCell>
                                        <div className="font-bold text-sm tracking-tight capitalize">{feature.text}</div>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground max-w-md truncate">
                                        {feature.description || "No description provided."}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            {activeIn.length === 0 ? <span className="text-[10px] text-muted-foreground italic">None</span> :
                                                activeIn.slice(0, 3).map(p => (
                                                    <Badge key={p._id || p.id} variant="outline" className="text-[9px] px-1 py-0 uppercase font-bold opacity-80">{p.name}</Badge>
                                                ))
                                            }
                                            {activeIn.length > 3 && <span className="text-[9px] text-muted-foreground">+{activeIn.length - 3} more</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1 opacity-100 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setCurrentFeature(feature); setIsDialogOpen(true); }}>
                                                <Edit className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/5" onClick={() => handleDelete(feature._id || feature.id)}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl bg-card border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-extrabold tracking-tight">
                            {currentFeature ? "Standard Feature Properties" : "New Global Listing"}
                        </DialogTitle>
                        <DialogDescription className="font-medium">Define how this feature appears across your pricing infrastructure.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-8 py-4">
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                                    Feature Display Name <span className="text-primary">*</span>
                                </Label>
                                <Input name="text" defaultValue={currentFeature?.text} required placeholder="e.g. Account Health Monitoring" className="h-12 bg-muted/20 border-none font-bold text-lg focus:ring-2 focus:ring-primary/20" />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Public Description</Label>
                                <Textarea name="description" defaultValue={currentFeature?.description} placeholder="Explain what this feature provides to the customer..." className="min-h-[100px] bg-muted/20 border-none focus:ring-2 focus:ring-primary/20" />
                            </div>
                            <div className="w-32">
                                <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground pb-2">Priority Order</Label>
                                <Input type="number" name="order" defaultValue={currentFeature?.order || 0} className="bg-muted/20 border-none" />
                            </div>
                        </div>

                        <div className="bg-muted/30 p-6 rounded-2xl border border-dashed">
                            <Label className="text-sm font-extrabold mb-4 block flex items-center gap-2 text-primary">
                                <Shield className="h-4 w-4" /> Entitlement Matrix
                            </Label>
                            <div className="grid grid-cols-2 gap-4">
                                {(plansData || []).map(plan => (
                                    <div key={plan._id || plan.id} className="flex items-center space-x-3 p-3 bg-card rounded-xl border border-transparent hover:border-primary/20 transition-all cursor-pointer shadow-sm group">
                                        <Checkbox
                                            id={`plan-${plan._id || plan.id}`}
                                            checked={selectedPlans.includes(plan._id || plan.id)}
                                            onCheckedChange={(checked) => {
                                                if (checked) setSelectedPlans([...selectedPlans, plan._id || plan.id]);
                                                else setSelectedPlans(selectedPlans.filter(pid => pid !== (plan._id || plan.id)));
                                            }}
                                            className="h-5 w-5 data-[state=checked]:bg-primary"
                                        />
                                        <Label htmlFor={`plan-${plan._id || plan.id}`} className="cursor-pointer capitalize font-bold text-sm flex-1 group-hover:text-primary transition-colors">
                                            {plan.name}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-4 italic font-medium">
                                * Syncing will automatically update these plans to either include or exclude this feature.
                            </p>
                        </div>

                        <DialogFooter className="gap-2">
                            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="font-semibold">Discard</Button>
                            <Button type="submit" disabled={isLoading} className="bg-primary font-bold px-8 shadow-lg shadow-primary/20">
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Sync Listings
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Helper for Feature List Management in Pricing Plans
function FeatureListManager({ features = [], globalFeatures = [], onChange, isViewMode }) {
    const handleAdd = () => {
        onChange([...features, { text: "", value: "", included: true }]);
    };
    const handleRemove = (text) => {
        onChange(features.filter((f) => f.text !== text));
    };
    const handleChange = (text, field, val) => {
        const existingIndex = features.findIndex(f => f.text === text);
        let newFeatures = [...features];
        if (existingIndex > -1) {
            newFeatures[existingIndex] = { ...newFeatures[existingIndex], [field]: val };
        } else {
            newFeatures.push({ text, value: field === 'value' ? val : "", included: field === 'included' ? val : false });
        }
        onChange(newFeatures);
    };

    // Prepare display list: Global items + any unique custom plan features
    const globalTexts = new Set((globalFeatures || []).map(gf => gf.text));
    const merged = (globalFeatures || []).map(gf => {
        const planF = features.find(f => f.text === gf.text);
        return {
            text: gf.text,
            value: planF?.value || "",
            included: planF?.included || false,
            isGlobal: true,
            description: gf.description
        };
    });
    const customs = features.filter(f => !globalTexts.has(f.text)).map(cf => ({ ...cf, isGlobal: false }));
    const displayList = [...merged, ...customs];

    return (
        <div className="space-y-4 border p-5 rounded-2xl bg-muted/20 shadow-inner">
            <div className="flex items-center justify-between border-b pb-3 mb-2">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded-lg">
                        <List className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <Label className="text-base font-extrabold tracking-tight">Entitlements & Features</Label>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Global & Custom Overrides</p>
                    </div>
                </div>
            </div>
            <div className="space-y-2">
                {displayList.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground italic text-sm border-2 border-dashed rounded-xl">
                        No features enabled for this plan.
                    </div>
                )}
                {displayList.map((feature, index) => (
                    <div key={index} className={`flex gap-4 items-start p-3 border rounded-xl bg-card group hover:shadow-md transition-all duration-300 relative ${!feature.included && 'opacity-60'}`}>
                        <div className="flex-1 pt-1">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Label</Label>
                                    {feature.isGlobal && (
                                        <Badge variant="secondary" className="text-[8px] h-3 px-1.5 font-extrabold bg-primary/5 text-primary">LIBRARY</Badge>
                                    )}
                                </div>
                                {feature.isGlobal ? (
                                    <div className="px-3 py-1.5 text-sm font-bold capitalize select-none h-9 flex items-center bg-muted/10 rounded-md truncate">
                                        {feature.text}
                                    </div>
                                ) : (
                                    <Input
                                        placeholder="e.g. Custom Perk"
                                        value={feature.text}
                                        onChange={(e) => handleChange(feature.text, 'text', e.target.value)}
                                        readOnly={isViewMode}
                                        className="bg-muted/30 border-none h-9 text-sm font-bold focus:ring-1 focus:ring-primary/20"
                                    />
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col items-center gap-1 px-3 border-l pb-1">
                            <Label className="text-[10px] uppercase font-extrabold text-primary pt-1">Active</Label>
                            <Checkbox
                                disabled={isViewMode}
                                checked={feature.included}
                                onCheckedChange={(val) => handleChange(feature.text, 'included', !!val)}
                                className="h-5 w-5 data-[state=checked]:bg-primary shadow-sm"
                            />
                        </div>
                        {!isViewMode && !feature.isGlobal && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-destructive h-8 w-8 hover:bg-destructive/10 rounded-full mt-2"
                                onClick={() => handleRemove(feature.text)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                ))}
            </div>
            {!isViewMode && displayList.length > 0 && (
                <p className="text-[10px] text-muted-foreground text-center font-bold tracking-tight bg-muted/10 py-2 rounded-lg">Items marked as 'LIBRARY' are shared globally. Changes in library will affect all plans.</p>
            )}
        </div>
    );
}

// 3. Pricing Manager
function PricingManager({ data, featuresData, onUpdate, refreshData }) {
    const [pricingData, setPricingData] = useState(Array.isArray(data) ? data : []);

    useEffect(() => {
        if (Array.isArray(data)) setPricingData(data);
    }, [data]);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentPlan, setCurrentPlan] = useState(null);
    const [isViewMode, setIsViewMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [durationValue, setDurationValue] = useState(1);
    const [durationUnit, setDurationUnit] = useState("month");
    const [features, setFeatures] = useState([]);

    useEffect(() => {
        if (currentPlan) {
            setDurationValue(currentPlan.durationValue || 1);
            setDurationUnit(currentPlan.durationUnit || "month");
            setFeatures(currentPlan.features || []);
        } else {
            setDurationValue(1);
            setDurationUnit("month");
            setFeatures([]);
        }
    }, [currentPlan]);

    const [searchQuery, setSearchQuery] = useState("");

    const formatPeriodLabel = (text) => normalizePeriod(text);

    const periodOptions = [
        "1 month",
        "2 month",
        "3 month",
        "6 month",
        "1 year"
    ].map(p => formatPeriodLabel(p));

    const handleSave = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.target);

        const durationValueNum = Number(durationValue) || 1;
        const durationUnitVal = durationUnit || "month";

        // Generate period label
        const periodLabel = durationValueNum === 1
            ? `per ${durationUnitVal}`
            : `per ${durationValueNum} ${durationUnitVal}s`;

        const updatedPlan = {
            id: currentPlan ? (currentPlan._id || currentPlan.id) : undefined,
            name: formData.get("name"),
            subtitle: formData.get("subtitle"),
            prices: { monthly: formData.get("monthly"), monthlyUSD: formData.get("monthly") },
            description: formData.get("description"),
            cta: formData.get("cta"),
            durationValue: durationValueNum,
            durationUnit: durationUnitVal,
            period: periodLabel,
            order: Number(formData.get("order")) || 0,
            highlighted: formData.get("highlighted") === "on",
            planId: currentPlan && currentPlan.planId ? currentPlan.planId : (formData.get("name") || "").toLowerCase().replace(/\s+/g, '-'),
            features: features
        };

        try {
            const savedPlan = await upsertPricingPlan(updatedPlan);
            if (savedPlan) {
                const updatedList = pricingData.some(p => p._id === savedPlan._id || p.id === savedPlan.id || (p.planId && p.planId === savedPlan.planId))
                    ? pricingData.map(p => (p._id === savedPlan._id || p.id === savedPlan.id || (p.planId && p.planId === savedPlan.planId)) ? savedPlan : p)
                    : [...pricingData, savedPlan];

                setPricingData(updatedList);
                onUpdate(updatedList);
                toast.success("Pricing plan updated successfully");
                setIsDialogOpen(false);
                if (refreshData) refreshData(true);
            } else {
                toast.error("Failed to update plan");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (plan) => {
        const id = plan._id || plan.id;
        if (!id) {
            toast.error("Cannot delete plan without ID");
            return;
        }

        if (!window.confirm(`Are you sure you want to delete the "${plan.name}" plan? This action cannot be undone.`)) return;

        setIsLoading(true);
        try {
            const res = await deletePricingPlan(id);
            if (res && res.success) {
                const updatedList = pricingData.filter(p => (p._id || p.id) !== id);
                setPricingData(updatedList);
                if (onUpdate) onUpdate(updatedList);
                toast.success("Pricing plan deleted successfully");
                if (refreshData) refreshData(true);
            } else {
                toast.error("Failed to delete pricing plan");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred while deleting");
        } finally {
            setIsLoading(false);
        }
    };

    const filteredPlans = useMemo(() => {
        return pricingData.filter(plan =>
            plan.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            plan.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [pricingData, searchQuery]);

    const [sortConfig, setSortConfig] = useState({ key: "order", direction: "asc" });

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <ChevronsUpDown className="ml-2 h-3 w-3 opacity-40 shrink-0" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="ml-2 h-3 w-3 text-primary shrink-0" />
            : <ArrowDown className="ml-2 h-3 w-3 text-primary shrink-0" />;
    };

    const sortedPlans = useMemo(() => {
        return [...filteredPlans].sort((a, b) => {
            let aVal = a[sortConfig.key] || 0;
            let bVal = b[sortConfig.key] || 0;
            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredPlans, sortConfig]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/30 p-4 rounded-xl border border-dashed">
                <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search pricing plans..."
                        className="pl-10 h-10 ring-offset-background focus-visible:ring-primary/20"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="outline" size="sm" onClick={() => refreshData()} title="Refresh Data" className="h-10 border-primary/10">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    <Button onClick={() => { setCurrentPlan(null); setIsViewMode(false); setIsDialogOpen(true); }} className="h-10 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 ring-offset-background">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Plan
                    </Button>
                </div>
            </div>

            <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
                <ScrollableContainer maxHeight="70vh">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-transparent border-b">
                                <TableHead className="w-[80px]">
                                    <button onClick={() => handleSort('order')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                        Order {getSortIcon('order')}
                                    </button>
                                </TableHead>
                                <TableHead>
                                    <button onClick={() => handleSort('name')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                        Plan Name {getSortIcon('name')}
                                    </button>
                                </TableHead>
                                <TableHead>Pricing</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Features</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedPlans.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                                        No pricing plans found.
                                    </TableCell>
                                </TableRow>
                            )}
                            {sortedPlans.map((plan, index) => (
                                <TableRow key={`${plan._id || plan.id || plan.planId || 'plan'}-${index}`} className="group hover:bg-muted/20 transition-colors">
                                    <TableCell className="font-bold text-muted-foreground/60">#{plan.order}</TableCell>
                                    <TableCell className="font-semibold">
                                        <div className="flex flex-col">
                                            <span className="capitalize text-foreground">{plan.name}</span>
                                            <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[150px]">{plan.subtitle}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm font-bold text-primary">
                                            {plan.prices?.monthly?.toString().startsWith('₹')
                                                ? plan.prices.monthly
                                                : (plan.prices?.monthly ? `₹${formatINR(plan.prices.monthly)}` : 'N/A')}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold capitalize">
                                                {plan.durationValue && plan.durationUnit ? (
                                                    `${plan.durationValue} ${plan.durationValue === 1 ? plan.durationUnit : `${plan.durationUnit}s`}`
                                                ) : (
                                                    // Fallback to period label if duration fields are missing due to schema sync
                                                    plan.period?.replace(/per\s+/i, '') || "1 Month"
                                                )}
                                            </span>
                                            <span className="text-[9px] text-muted-foreground uppercase font-medium">{plan.period}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1.5 flex-wrap">
                                            {plan.highlighted && <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-200/50 text-[10px] px-1.5 py-0">POPULAR</Badge>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <List className="h-3 w-3 text-primary" />
                                            </div>
                                            <span className="text-sm font-medium">{plan.features?.length || 0} Features</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => { setCurrentPlan(plan); setIsViewMode(true); setIsDialogOpen(true); }}><Eye className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary/70 hover:text-primary" onClick={() => { setCurrentPlan(plan); setIsViewMode(false); setIsDialogOpen(true); }}><Edit className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(plan)} title="Delete Plan"><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollableContainer>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col p-0 gap-0 overflow-hidden rounded-3xl border-none shadow-2xl">
                    <DialogHeader className="p-8 pb-4 bg-gradient-to-br from-primary/5 via-primary/[0.02] to-transparent border-b">
                        <div className="flex items-center justify-between mt-2">
                            <div className="space-y-1">
                                <DialogTitle className="text-2xl font-bold tracking-tight">
                                    {isViewMode ? "Plan Details" : currentPlan ? "Configure Plan" : "New Pricing Strategy"}
                                </DialogTitle>
                                <DialogDescription className="text-sm font-medium">
                                    Design and manage the service tiers for your marketplaces.
                                </DialogDescription>
                            </div>
                            {!isViewMode && (
                                <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 h-7">
                                    DRAFT MODE
                                </Badge>
                            )}
                        </div>
                    </DialogHeader>

                    <ScrollableContainer className="flex-1 p-8 pt-6 pb-24 scrollbar-none">
                        {isViewMode ? (
                            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                                <div className="grid md:grid-cols-3 gap-6">
                                    <div className="md:col-span-2 space-y-6">
                                        <div className="bg-card p-6 rounded-2xl border shadow-sm">
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <h3 className="text-xl font-bold tracking-tight capitalize">{currentPlan?.name}</h3>
                                                    <p className="text-muted-foreground text-sm font-medium">{currentPlan?.subtitle}</p>
                                                </div>
                                                {currentPlan?.highlighted && (
                                                    <Badge className="bg-amber-500 text-white border-none shadow-md shadow-amber-500/20">POPULAR</Badge>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 gap-4 mt-6">
                                                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                                                    <Label className="text-[10px] uppercase font-bold text-primary/70 tracking-wider">Public Pricing</Label>
                                                    <p className="text-2xl font-black text-primary mt-1">{currentPlan?.prices?.monthly}</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{currentPlan?.period}</p>
                                                </div>
                                            </div>
                                            <div className="mt-8 space-y-3">
                                                <Label className="text-sm font-bold flex items-center gap-2">
                                                    <Check className="h-4 w-4 text-green-500" />
                                                    Strategic Description
                                                </Label>
                                                <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/20 pl-4">{currentPlan?.description}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <Card className="border-none shadow-sm bg-muted/20 h-full">
                                            <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-70">Client Summary</CardTitle></CardHeader>
                                            <CardContent className="space-y-4 pt-2">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Internal ID</p>
                                                    <Badge variant="outline" className="font-mono text-[10px] py-0">{currentPlan?.planId}</Badge>
                                                </div>
                                                <div className="space-y-1 pt-2">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Call to Action</p>
                                                    <p className="text-sm font-bold border-b pb-1">{currentPlan?.cta}</p>
                                                </div>
                                                <div className="pt-4 flex items-center gap-2">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Active in Production</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>

                                <FeatureListManager isViewMode={true} features={currentPlan?.features} globalFeatures={featuresData} />
                            </div>
                        ) : (
                            <form id="pricing-form" onSubmit={handleSave} className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="grid lg:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Internal Name</Label>
                                                <Input name="name" defaultValue={currentPlan?.name} required className="h-11 rounded-xl focus:ring-primary/20" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tagline/Subtitle</Label>
                                                <Input name="subtitle" defaultValue={currentPlan?.subtitle} className="h-11 rounded-xl" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Display Price (INR)</Label>
                                                <Input name="monthly" defaultValue={currentPlan?.prices?.monthly} required placeholder="₹45,000" className="h-11 rounded-xl font-bold text-primary" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Billing Duration</Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        type="number"
                                                        name="durationValue"
                                                        value={durationValue}
                                                        onChange={(e) => setDurationValue(e.target.value)}
                                                        className="w-20 h-11 rounded-xl"
                                                        min="1"
                                                    />
                                                    <Select
                                                        name="durationUnit"
                                                        value={durationUnit}
                                                        onValueChange={setDurationUnit}
                                                    >
                                                        <SelectTrigger className="h-11 rounded-xl flex-1 bg-background">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="day">Day(s)</SelectItem>
                                                            <SelectItem value="month">Month(s)</SelectItem>
                                                            <SelectItem value="year">Year(s)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Marketing Description</Label>
                                            <Textarea name="description" defaultValue={currentPlan?.description} className="rounded-xl min-h-[100px] bg-muted/10 resize-none" />
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <Card className="border-none shadow-none bg-muted/30 rounded-2xl">
                                            <CardContent className="p-6 space-y-6">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">CTA Button Text</Label>
                                                        <Input name="cta" defaultValue={currentPlan?.cta || "Get Started"} className="h-11 rounded-xl bg-background" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sequence Order</Label>
                                                        <Input type="number" name="order" defaultValue={currentPlan?.order || 0} className="h-11 rounded-xl bg-background" />
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-3 bg-background/60 p-3 rounded-xl border border-dashed border-primary/20">
                                                    <Checkbox id="highlighted" name="highlighted" defaultChecked={currentPlan?.highlighted} className="h-5 w-5 rounded-md" />
                                                    <div className="grid gap-1">
                                                        <Label htmlFor="highlighted" className="font-bold text-sm tracking-tight cursor-pointer">Badge as High-Value</Label>
                                                        <p className="text-[10px] text-muted-foreground font-medium italic">Adds a glowing "Popular" tag in the pricing grid.</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>

                                <FeatureListManager features={features} onChange={setFeatures} globalFeatures={featuresData} isViewMode={false} />
                            </form>
                        )}
                    </ScrollableContainer>

                    <DialogFooter className="p-8 bg-background/80 backdrop-blur-md border-t absolute bottom-0 left-0 right-0 z-50">
                        <div className="flex items-center justify-between w-full">
                            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="px-6 rounded-xl hover:bg-muted font-bold text-muted-foreground uppercase text-xs tracking-widest">
                                Close Portal
                            </Button>
                            {!isViewMode && (
                                <Button type="submit" form="pricing-form" disabled={isLoading} className="px-8 rounded-xl h-11 bg-primary hover:bg-primary/95 shadow-xl shadow-primary/20 transition-all active:scale-95">
                                    {isLoading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Shield className="mr-2 h-4 w-4" />
                                    )}
                                    <span className="font-bold uppercase tracking-widest text-xs">Authorize & Synchronize</span>
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// 4. Catalog Manager
function CatalogManager({ data, onUpdate, refreshData }) {
    const [services, setServices] = useState(Array.isArray(data) ? data : []);

    useEffect(() => {
        if (Array.isArray(data)) setServices(data);
    }, [data]);

    const [search, setSearch] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentService, setCurrentService] = useState(null);
    const [isViewMode, setIsViewMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.target);

        const newService = {
            id: currentService ? (currentService._id || currentService.id) : undefined,
            name: formData.get("name"),
            category: formData.get("category"),
            serviceId: currentService && currentService.serviceId ? currentService.serviceId : `cat-${Date.now()}`,
            pricing: {
                standard: formData.get("stdPrice") ? { price: Number(formData.get("stdPrice")), label: formData.get("stdLabel") } : null,
                priority: formData.get("prioPrice") ? { price: Number(formData.get("prioPrice")), label: formData.get("prioLabel") } : null
            }
        };

        try {
            const savedService = await upsertCatalogService(newService);
            if (savedService) {
                const updatedServices = services.some(s => s._id === savedService._id || s.id === savedService.id)
                    ? services.map(s => (s._id === savedService._id || s.id === savedService.id) ? savedService : s)
                    : [...services, savedService];

                setServices(updatedServices);
                onUpdate(updatedServices);
                toast.success(currentService ? "Updated" : "Added");
                setIsDialogOpen(false);
                if (refreshData) refreshData(true);
            } else {
                toast.error("Failed to save catalog item");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (confirm("Delete catalog item?")) {
            setIsLoading(true);
            try {
                const res = await deleteCatalogService(id);
                if (res.success) {
                    const updated = services.filter(s => s._id !== id && s.id !== id);
                    setServices(updated);
                    onUpdate(updated);
                    toast.success("Deleted");
                } else {
                    toast.error("Failed to delete");
                }
            } catch (error) {
                toast.error("Error deleting item");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <ChevronsUpDown className="ml-2 h-3 w-3 opacity-40 shrink-0" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="ml-2 h-3 w-3 text-primary shrink-0" />
            : <ArrowDown className="ml-2 h-3 w-3 text-primary shrink-0" />;
    };

    const sortedServices = [...services].filter(s => s.name?.toLowerCase().includes(search.toLowerCase())).sort((a, b) => {
        let aVal = a[sortConfig.key] || "";
        let bVal = b[sortConfig.key] || "";
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Input placeholder="Search..." className="max-w-sm" onChange={(e) => setSearch(e.target.value)} />
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => refreshData()} title="Refresh Data">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    <Button onClick={() => { setCurrentService(null); setIsViewMode(false); setIsDialogOpen(true); }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Item
                    </Button>
                </div>
            </div>
            <div className="rounded-md border bg-card overflow-hidden">
                <ScrollableContainer maxHeight="50vh">
                    <Table wrapperClassName="overflow-visible">
                        <TableHeader className="sticky top-0 z-10 bg-card shadow-sm border-b">
                            <TableRow>
                                <TableHead>
                                    <button onClick={() => handleSort('name')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                        Name {getSortIcon('name')}
                                    </button>
                                </TableHead>
                                <TableHead>
                                    <button onClick={() => handleSort('category')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                        Category {getSortIcon('category')}
                                    </button>
                                </TableHead>
                                <TableHead className="font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">Standard</TableHead>
                                <TableHead className="font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">Priority (2 hr) </TableHead>
                                <TableHead className="text-right font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedServices.map((s, index) => (
                                <TableRow key={`${s._id || s.id || 'catalog'}-${index}`}>
                                    <TableCell className="font-medium capitalize">{s.name}</TableCell>
                                    <TableCell><Badge variant="outline">{s.category}</Badge></TableCell>
                                    <TableCell>{s.pricing?.standard ? `₹${s.pricing.standard.price}` : "-"}</TableCell>
                                    <TableCell>{s.pricing?.priority ? `₹${s.pricing.priority.price}` : "-"}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => { setCurrentService(s); setIsViewMode(true); setIsDialogOpen(true); }}><Eye className="w-4 h-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => { setCurrentService(s); setIsViewMode(false); setIsDialogOpen(true); }}><Edit className="w-4 h-4" /></Button>
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(s._id || s.id)}><Trash2 className="w-4 h-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollableContainer>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-h-[85vh] flex flex-col p-0 gap-0">
                    <DialogHeader className="p-6 pb-2"><DialogTitle>{isViewMode ? "View Item" : "Edit/Add Item"}</DialogTitle></DialogHeader>
                    <ScrollableContainer className="flex-1 p-6 pt-2">
                        {isViewMode ? (
                            <div className="space-y-4">
                                <div><Label>Name</Label><p className="capitalize">{currentService?.name}</p></div><div><Label>Category</Label><Badge>{currentService?.category}</Badge></div>
                                <div className="grid grid-cols-2 gap-4 border p-4 rounded text-center">
                                    <div><Label>Standard</Label><p className="text-xl font-bold">{currentService?.pricing?.standard ? `₹${currentService?.pricing.standard.price}` : "N/A"}</p><p className="text-xs text-muted-foreground">{currentService?.pricing?.standard?.label}</p></div>
                                    <div><Label>Priority</Label><p className="text-xl font-bold text-amber-600">{currentService?.pricing?.priority ? `₹${currentService?.pricing.priority.price}` : "N/A"}</p><p className="text-xs text-muted-foreground">{currentService?.pricing?.priority?.label}</p></div>
                                </div>
                            </div>
                        ) : (
                            <form id="catalog-form" onSubmit={handleSave} className="space-y-4">
                                <div className="grid gap-2"><Label>Name</Label><Input name="name" defaultValue={currentService?.name} required /></div>
                                <div className="grid gap-2"><Label>Category</Label><Input name="category" defaultValue={currentService?.category} required /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Standard Price</Label><Input type="number" name="stdPrice" defaultValue={currentService?.pricing?.standard?.price} /><Input name="stdLabel" defaultValue={currentService?.pricing?.standard?.label || "Detailed"} placeholder="Label" /></div>
                                    <div className="space-y-2"><Label>Priority Price</Label><Input type="number" name="prioPrice" defaultValue={currentService?.pricing?.priority?.price} /><Input name="prioLabel" defaultValue={currentService?.pricing?.priority?.label || "Within 2 Hours"} placeholder="Label" /></div>
                                </div>
                            </form>
                        )}
                    </ScrollableContainer>
                    {!isViewMode && (
                        <DialogFooter className="p-6 pt-2 border-t">
                            <Button type="submit" form="catalog-form" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save
                            </Button>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

const quillModules = {
    toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link', 'image', 'code-block'],
        ['clean']
    ]
};

// Milestone Manager
function MilestoneManager({ data, onUpdate, refreshData }) {
    const [milestones, setMilestones] = useState(Array.isArray(data) ? data : []);

    useEffect(() => {
        if (Array.isArray(data)) setMilestones(data);
    }, [data]);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentMilestone, setCurrentMilestone] = useState(null);
    const [isViewMode, setIsViewMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const handleDelete = async (id) => {
        if (confirm("Delete milestone?")) {
            setIsLoading(true);
            try {
                const res = await deleteMilestone(id);
                if (res.success) {
                    const updated = milestones.filter(m => m._id !== id && m.id !== id);
                    setMilestones(updated);
                    onUpdate(updated);
                    toast.success("Deleted");
                } else {
                    toast.error("Failed to delete");
                }
            } catch (error) {
                toast.error("Error deleting milestone");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.target);

        const newMilestone = {
            id: currentMilestone ? (currentMilestone._id || currentMilestone.id) : undefined,
            year: formData.get("year"),
            title: formData.get("title"),
            description: formData.get("description"),
            image: formData.get("image"),
            order: Number(formData.get("order")) || 0
        };

        try {
            const saved = await upsertMilestone(newMilestone);
            if (saved) {
                const updated = milestones.some(m => m._id === saved._id || m.id === saved.id)
                    ? milestones.map(m => (m._id === saved._id || m.id === saved.id) ? saved : m)
                    : [...milestones, saved];

                const sorted = updated.sort((a, b) => (a.order || 0) - (b.order || 0));
                setMilestones(sorted);
                onUpdate(sorted);
                toast.success(currentMilestone ? "Updated" : "Added");
                setIsDialogOpen(false);
                if (refreshData) refreshData(true);
            } else {
                toast.error("Failed to save milestone");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const sortedMilestones = useMemo(() => {
        return [...milestones].filter(m =>
            m.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.year?.toLowerCase().includes(searchQuery.toLowerCase())
        ).sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [milestones, searchQuery]);

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/30 p-4 rounded-xl border border-dashed text-sm">
                <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search milestones..."
                        className="pl-10 h-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => refreshData()} title="Refresh Data">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    <Button onClick={() => { setCurrentMilestone(null); setIsViewMode(false); setIsDialogOpen(true); }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Milestone
                    </Button>
                </div>
            </div>

            <div className="rounded-md border bg-card overflow-hidden">
                <ScrollableContainer maxHeight="60vh">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="w-20">Order</TableHead>
                                <TableHead className="w-24">Year</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedMilestones.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground italic">No milestones found.</TableCell>
                                </TableRow>
                            )}
                            {sortedMilestones.map((m) => (
                                <TableRow key={m._id || m.id} className="group hover:bg-muted/20 transition-colors">
                                    <TableCell className="font-mono text-xs text-muted-foreground">#{m.order}</TableCell>
                                    <TableCell className="font-bold text-primary">{m.year}</TableCell>
                                    <TableCell className="font-semibold capitalize">{m.title}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => { setCurrentMilestone(m); setIsViewMode(true); setIsDialogOpen(true); }}><Eye className="w-4 h-4" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => { setCurrentMilestone(m); setIsViewMode(false); setIsDialogOpen(true); }}><Edit className="w-4 h-4" /></Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(m._id || m.id)}><Trash2 className="w-4 h-4" /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollableContainer>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl bg-card border-none shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-8 pb-4 bg-muted/30 border-b">
                        <DialogTitle className="text-xl font-bold tracking-tight">
                            {isViewMode ? "Milestone Details" : currentMilestone ? "Edit Achievement" : "Add New Milestone"}
                        </DialogTitle>
                        <DialogDescription className="font-medium">Track your company's journey and key successes.</DialogDescription>
                    </DialogHeader>

                    <ScrollableContainer className="max-h-[70vh] p-8 pt-6">
                        {isViewMode ? (
                            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                                <div className="aspect-video relative rounded-2xl overflow-hidden bg-muted border shadow-inner">
                                    {currentMilestone?.image ? (
                                        <img src={currentMilestone.image} alt={currentMilestone.title} className="object-cover w-full h-full" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                                            <Building className="w-12 h-12" />
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-6 p-4 bg-muted/20 rounded-xl border border-dashed">
                                    <div><Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Target Year</Label><p className="font-black text-2xl text-primary">{currentMilestone?.year}</p></div>
                                    <div><Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Display Priority</Label><p className="font-mono text-xl">#{currentMilestone?.order}</p></div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Headline</Label>
                                    <h3 className="text-2xl font-bold tracking-tight capitalize text-foreground">{currentMilestone?.title}</h3>
                                </div>
                                <div className="space-y-2 border-l-2 border-primary/20 pl-4">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Context & Story</Label>
                                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{currentMilestone?.description || "No description provided."}</p>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSave} id="milestone-form" className="space-y-8 py-2">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Milestone Year <span className="text-primary">*</span></Label>
                                        <Input name="year" defaultValue={currentMilestone?.year} required placeholder="e.g. 2024" className="h-12 bg-muted/20 border-none font-bold text-lg focus:ring-2 focus:ring-primary/20" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Display Order</Label>
                                        <Input type="number" name="order" defaultValue={currentMilestone?.order || 0} className="h-12 bg-muted/20 border-none font-mono focus:ring-2 focus:ring-primary/20" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Achievement Headline <span className="text-primary">*</span></Label>
                                    <Input name="title" defaultValue={currentMilestone?.title} required placeholder="e.g. Global Expansion Commenced" className="h-12 bg-muted/20 border-none font-bold focus:ring-2 focus:ring-primary/20" />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Story / Description</Label>
                                    <Textarea name="description" defaultValue={currentMilestone?.description} rows={4} placeholder="Briefly describe the significance of this milestone..." className="bg-muted/20 border-none resize-none focus:ring-2 focus:ring-primary/20" />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Visual Asset</Label>
                                    <ImagePicker name="image" label="Milestone Image" value={currentMilestone?.image} className="bg-muted/20 border-none" />
                                </div>
                            </form>
                        )}
                    </ScrollableContainer>

                    <DialogFooter className="p-8 border-t bg-background">
                        <div className="flex justify-between items-center w-full">
                            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="font-bold text-xs uppercase tracking-widest">Discard Changes</Button>
                            {!isViewMode && (
                                <Button type="submit" form="milestone-form" disabled={isLoading} className="bg-primary hover:bg-primary/90 font-bold px-8 shadow-lg shadow-primary/20 transition-all active:scale-95 h-11">
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Sync Milestone
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// 5. Blog Manager
function BlogManager({ data, onUpdate, refreshData }) {
    const [posts, setPosts] = useState(Array.isArray(data) ? data : []);

    // Sync with parent data if it's fetched asynchronously
    useEffect(() => {
        if (Array.isArray(data)) {
            setPosts(data);
            setAvailableCategories(Array.from(new Set(data.map(p => p.category))));
        }
    }, [data]);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentPost, setCurrentPost] = useState(null);
    const [isViewMode, setIsViewMode] = useState(false);
    const [tags, setTags] = useState([]);
    const [content, setContent] = useState("");
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");

    // Loading State
    const [isLoading, setIsLoading] = useState(false);

    // Category Management
    const [availableCategories, setAvailableCategories] = useState(
        Array.from(new Set((Array.isArray(data) ? data : []).map(p => p.category)))
    );
    const [selectedCategory, setSelectedCategory] = useState("");
    const [customCategory, setCustomCategory] = useState("");

    // Thumbnail Management
    const [thumbnailUrl, setThumbnailUrl] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (!currentPost && title) {
            setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
        }
    }, [title, currentPost]);

    const handleOpen = (post, view) => {
        setCurrentPost(post);
        setIsViewMode(view);
        setTags(post?.tags || []);
        setContent(post?.content || "");
        setTitle(post?.title || "");
        setSlug(post?.slug || "");
        setSelectedCategory(post?.category && availableCategories.includes(post.category) ? post.category : (post?.category ? "Other" : ""));
        setCustomCategory(post?.category && !availableCategories.includes(post.category) ? post.category : "");
        setThumbnailUrl(post?.thumbnail || "");
        setIsDialogOpen(true);
    };

    const handleDelete = async (id) => {
        if (confirm("Delete blog post?")) {
            setIsLoading(true);
            try {
                const res = await deleteBlogPost(id);
                if (res.success) {
                    const updated = posts.filter(p => p._id !== id && p.id !== id);
                    setPosts(updated);
                    onUpdate(updated);
                    toast.success("Deleted");
                } else {
                    toast.error("Failed to delete");
                }
            } catch (error) {
                toast.error("Error deleting post");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.target);

        const finalCategory = selectedCategory === "Other" ? customCategory : selectedCategory;
        if (selectedCategory === "Other" && customCategory && !availableCategories.includes(customCategory)) {
            setAvailableCategories([...availableCategories, customCategory]);
        }

        const newPost = {
            id: currentPost ? (currentPost._id || currentPost.id) : undefined,
            title: title,
            excerpt: formData.get("excerpt"),
            category: finalCategory,
            date: currentPost?.date || new Date().toLocaleDateString(),
            publishDate: currentPost?.publishDate || new Date().toISOString().split('T')[0],
            readTime: formData.get("readTime"),
            slug: slug,
            thumbnail: thumbnailUrl,
            tags: tags,
            author: { name: formData.get("authorName"), role: formData.get("authorRole"), image: formData.get("authorImage") },
            content: content
        };

        try {
            const savedPost = await upsertBlogPost(newPost);
            if (savedPost) {
                const updatedPosts = posts.some(p => p._id === savedPost._id || p.id === savedPost.id)
                    ? posts.map(p => (p._id === savedPost._id || p.id === savedPost.id) ? savedPost : p)
                    : [savedPost, ...posts];

                setPosts(updatedPosts);
                onUpdate(updatedPosts);

                toast.success(currentPost ? "Updated" : "Created");
                setIsDialogOpen(false);
                if (refreshData) refreshData(true);
            } else {
                toast.error("Failed to save blog post");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <ChevronsUpDown className="ml-2 h-3 w-3 opacity-40 shrink-0" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="ml-2 h-3 w-3 text-primary shrink-0" />
            : <ArrowDown className="ml-2 h-3 w-3 text-primary shrink-0" />;
    };

    const [sortConfig, setSortConfig] = useState({ key: "title", direction: "desc" });

    const filteredPosts = useMemo(() => {
        return posts.filter(p =>
            p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.author?.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [posts, searchQuery]);

    const sortedPosts = useMemo(() => {
        return [...filteredPosts].sort((a, b) => {
            let aVal = a[sortConfig.key] || "";
            let bVal = b[sortConfig.key] || "";
            if (sortConfig.key === 'author') {
                aVal = a.author?.name || "";
                bVal = b.author?.name || "";
            }
            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredPosts, sortConfig]);

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/30 p-4 rounded-xl border border-dashed">
                <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search blog posts..."
                        className="pl-10 h-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="outline" size="sm" onClick={() => refreshData()} title="Refresh Data" className="h-10">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    <Button onClick={() => handleOpen(null, false)} className="h-10 bg-primary shadow-lg shadow-primary/20">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Post
                    </Button>
                </div>
            </div>
            <div className="rounded-md border bg-card overflow-hidden">
                <ScrollableContainer maxHeight="50vh">
                    <Table wrapperClassName="overflow-visible">
                        <TableHeader className="sticky top-0 z-10 bg-card shadow-sm border-b">
                            <TableRow>
                                <TableHead>
                                    <button onClick={() => handleSort('title')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                        Title {getSortIcon('title')}
                                    </button>
                                </TableHead>
                                <TableHead>
                                    <button onClick={() => handleSort('category')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                        Category {getSortIcon('category')}
                                    </button>
                                </TableHead>
                                <TableHead>
                                    <button onClick={() => handleSort('author')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                        Author {getSortIcon('author')}
                                    </button>
                                </TableHead>
                                <TableHead className="text-right font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedPosts.map((p, index) => (
                                <TableRow key={`${p._id || p.id || 'post'}-${index}`}>
                                    <TableCell className="font-medium max-w-xs truncate capitalize">{p.title}</TableCell>
                                    <TableCell><Badge variant="outline">{p.category}</Badge></TableCell>
                                    <TableCell className="capitalize">{p.author?.name}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpen(p, true)}><Eye className="w-4 h-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleOpen(p, false)}><Edit className="w-4 h-4" /></Button>
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(p._id || p.id)}><Trash2 className="w-4 h-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollableContainer>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
                    <DialogHeader className="p-6 pb-2"><DialogTitle>{isViewMode ? "View Post" : "Edit Post"}</DialogTitle></DialogHeader>
                    <ScrollableContainer className="flex-1 p-6 pt-2">
                        {isViewMode ? (
                            <div className="space-y-4">
                                <img src={currentPost?.thumbnail || undefined} alt="cover" className="w-full h-40 object-cover rounded-md" />
                                <h2 className="text-xl font-bold capitalize">{currentPost?.title}</h2>
                                <div className="flex gap-2 text-sm text-muted-foreground"><span className="capitalize">{currentPost?.date}</span><span>•</span><span>{currentPost?.readTime}</span><span>•</span><span className="capitalize">{currentPost?.author?.name}</span></div>
                                <div className="flex gap-2">{currentPost?.tags?.map(t => <Badge key={t} variant="secondary">{t}</Badge>)}</div>
                                <p className="italic border-l-4 border-primary pl-4">{currentPost?.excerpt}</p>
                                <div className="space-y-2"><h4 className="font-semibold">Content</h4><div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: currentPost?.content }} /></div>
                            </div>
                        ) : (
                            <form id="blog-form" onSubmit={handleSave} className="space-y-6">
                                <div className="grid lg:grid-cols-3 gap-6">
                                    {/* Main Content Application */}
                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="space-y-4">
                                            <div className="space-y-2"><Label>Title</Label><Input name="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Enter post title" className="text-lg font-medium" /></div>
                                            <div className="space-y-2"><Label>Slug</Label><Input name="slug" value={slug} onChange={(e) => setSlug(e.target.value)} className="bg-muted" readOnly /></div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Content</Label>
                                            <div className="h-[500px] mb-12">
                                                <ReactQuill
                                                    theme="snow"
                                                    value={content}
                                                    onChange={setContent}
                                                    className="h-full flex flex-col"
                                                    modules={quillModules}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2 pt-6">
                                            <Label>Excerpt</Label>
                                            <Textarea name="excerpt" defaultValue={currentPost?.excerpt} placeholder="Brief summary of the post..." rows={3} />
                                        </div>
                                    </div>

                                    {/* Sidebar Settings */}
                                    <div className="space-y-6">
                                        {/* Publishing Settings */}
                                        <Card>
                                            <CardHeader className="py-3 bg-muted/30"><CardTitle className="text-base">Publishing</CardTitle></CardHeader>
                                            <CardContent className="p-4 space-y-4">
                                                <div className="space-y-2">
                                                    <Label>Category</Label>
                                                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                                        <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                                                        <SelectContent>
                                                            {availableCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                                            <SelectItem value="Other">Other (Add New)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    {selectedCategory === "Other" && (
                                                        <Input
                                                            placeholder="Enter new category"
                                                            value={customCategory}
                                                            onChange={(e) => setCustomCategory(e.target.value)}
                                                            className="mt-2 animate-in fade-in"
                                                        />
                                                    )}
                                                </div>
                                                <div className="space-y-2"><Label>Read Time</Label><Input name="readTime" defaultValue={currentPost?.readTime} placeholder="e.g. 5 min read" /></div>
                                                <ArrayInput values={tags} onChange={setTags} label="Tags" placeholder="Add tag..." />
                                            </CardContent>
                                        </Card>

                                        {/* Author Settings */}
                                        <Card>
                                            <CardHeader className="py-3 bg-muted/30"><CardTitle className="text-base">Author Details</CardTitle></CardHeader>
                                            <CardContent className="p-4 space-y-4">
                                                <div className="space-y-2"><Label>Name</Label><Input name="authorName" defaultValue={currentPost?.author?.name} /></div>
                                                <div className="space-y-2"><Label>Role</Label><Input name="authorRole" defaultValue={currentPost?.author?.role} /></div>
                                                <div className="space-y-2"><Label>Profile Image</Label><ImagePicker name="authorImage" label="Author Image" value={currentPost?.author?.image} /></div>
                                            </CardContent>
                                        </Card>

                                        {/* Thumbnail Settings */}
                                        <Card>
                                            <CardHeader className="py-3 bg-muted/30"><CardTitle className="text-base">Featured Image</CardTitle></CardHeader>
                                            <CardContent className="p-4">
                                                <ImagePicker
                                                    name="thumbnail"
                                                    label="Thumbnail"
                                                    value={thumbnailUrl}
                                                    onChange={setThumbnailUrl}
                                                />
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            </form>
                        )}
                    </ScrollableContainer>
                    {!isViewMode && (
                        <DialogFooter className=" bottom-0 bg-background p-6 pt-2 border-t">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" form="blog-form" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

// 6. Service Manager
function ServiceManager({ data, onUpdate, refreshData }) {
    const [services, setServices] = useState(Array.isArray(data) ? data : []);

    useEffect(() => {
        if (Array.isArray(data)) setServices(data);
    }, [data]);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentService, setCurrentService] = useState(null);
    const [isViewMode, setIsViewMode] = useState(false);
    const [features, setFeatures] = useState([]);
    const [benefits, setBenefits] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleOpen = (service, view) => {
        setCurrentService(service);
        setIsViewMode(view);
        setFeatures(service?.features || []);
        setBenefits(service?.benefits || []);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id) => {
        if (confirm("Delete service?")) {
            setIsLoading(true);
            try {
                const res = await deleteService(id);
                if (res.success) {
                    const updated = services.filter(s => s._id !== id && s.id !== id);
                    setServices(updated);
                    onUpdate(updated);
                    toast.success("Deleted");
                } else {
                    toast.error("Failed to delete");
                }
            } catch (error) {
                toast.error("Error deleting service");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.target);

        const newService = {
            id: currentService ? (currentService._id || currentService.id) : undefined,
            serviceId: currentService && currentService.serviceId ? currentService.serviceId : (formData.get("title") || "").toLowerCase().replace(/\s+/g, '-'),
            title: formData.get("title"),
            shortDescription: formData.get("shortDescription"),
            fullDescription: formData.get("fullDescription"),
            icon: formData.get("icon"),
            category: formData.get("category"),
            features: features,
            benefits: benefits,
            order: Number(formData.get("order")) || services.length + 1
        };

        try {
            const savedService = await upsertService(newService);
            if (savedService) {
                const updatedServices = services.some(s => s._id === savedService._id || s.id === savedService.id)
                    ? services.map(s => (s._id === savedService._id || s.id === savedService.id) ? savedService : s)
                    : [...services, savedService];

                const sortedServices = updatedServices.sort((a, b) => (a.order || 0) - (b.order || 0));

                setServices(sortedServices);
                onUpdate(sortedServices);
                toast.success(currentService ? "Updated" : "Added");
                setIsDialogOpen(false);
                if (refreshData) refreshData(true);
            } else {
                toast.error("Failed to save service");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const [sortConfig, setSortConfig] = useState({ key: "order", direction: "asc" });

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <ChevronsUpDown className="ml-2 h-3 w-3 opacity-40 shrink-0" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="ml-2 h-3 w-3 text-primary shrink-0" />
            : <ArrowDown className="ml-2 h-3 w-3 text-primary shrink-0" />;
    };

    const sortedServices = [...services].sort((a, b) => {
        let aVal = a[sortConfig.key] || "";
        let bVal = b[sortConfig.key] || "";
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Input placeholder="Search..." className="max-w-sm" />
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => refreshData()} title="Refresh Data">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    <Button onClick={() => handleOpen(null, false)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Service
                    </Button>
                </div>
            </div>
            <div className="rounded-md border bg-card overflow-hidden">
                <ScrollableContainer maxHeight="50vh">
                    <Table wrapperClassName="overflow-visible">
                        <TableHeader className="sticky top-0 z-10 bg-card shadow-sm border-b">
                            <TableRow>
                                <TableHead>
                                    <button onClick={() => handleSort('title')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                        Title {getSortIcon('title')}
                                    </button>
                                </TableHead>
                                <TableHead>
                                    <button onClick={() => handleSort('category')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                        Category {getSortIcon('category')}
                                    </button>
                                </TableHead>
                                <TableHead className="font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">Icon</TableHead>
                                <TableHead className="text-right font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedServices.map((s, index) => (
                                <TableRow key={`${s._id || s.id || 'service'}-${index}`}>
                                    <TableCell className="font-medium capitalize">{s.title}</TableCell>
                                    <TableCell><Badge variant="outline">{s.category}</Badge></TableCell>
                                    <TableCell><code className="text-xs bg-muted px-1 rounded">{s.icon}</code></TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpen(s, true)}><Eye className="w-4 h-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleOpen(s, false)}><Edit className="w-4 h-4" /></Button>
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(s._id || s.id)}><Trash2 className="w-4 h-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollableContainer>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0">
                    <DialogHeader className="p-6 pb-2"><DialogTitle>{isViewMode ? "View Service" : "Edit Service"}</DialogTitle></DialogHeader>
                    <ScrollableContainer className="flex-1 p-6 pt-2">
                        {isViewMode ? (
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <div><h3 className="text-xl font-bold capitalize">{currentService?.title}</h3><Badge variant="secondary" className="mt-1">{currentService?.category}</Badge></div>
                                    <div className="p-2 bg-muted rounded-full"><Shield className="w-6 h-6" /></div>
                                </div>
                                <p className="text-muted-foreground">{currentService?.shortDescription}</p>
                                <div className="prose prose-sm max-w-none"><h4 className="font-semibold">Full Description</h4><p>{currentService?.fullDescription}</p></div>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div><h4 className="font-semibold mb-2">Features</h4><ul className="list-disc pl-5 text-sm space-y-1">{currentService?.features?.map((f, i) => <li key={i}>{f}</li>)}</ul></div>
                                    <div><h4 className="font-semibold mb-2">Benefits</h4><ul className="list-disc pl-5 text-sm space-y-1">{currentService?.benefits?.map((b, i) => <li key={i}>{b}</li>)}</ul></div>
                                </div>
                            </div>
                        ) : (
                            <form id="service-form" onSubmit={handleSave} className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="grid gap-2"><Label>Title</Label><Input name="title" defaultValue={currentService?.title} required /></div>
                                    <div className="grid gap-2"><Label>Icon Name (Lucide)</Label><Input name="icon" defaultValue={currentService?.icon} placeholder="e.g. Shield" /></div>
                                </div>
                                <div className="grid gap-2"><Label>Category</Label><Select name="category" defaultValue={currentService?.category}><SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger><SelectContent><SelectItem value="Account Services">Account Services</SelectItem><SelectItem value="Listing & Content">Listing & Content</SelectItem><SelectItem value="Operations">Operations</SelectItem><SelectItem value="Growth">Growth</SelectItem></SelectContent></Select></div>
                                <div className="grid gap-2"><Label>Short Description</Label><Textarea name="shortDescription" defaultValue={currentService?.shortDescription} rows={2} /></div>
                                <div className="grid gap-2"><Label>Full Description</Label><Textarea name="fullDescription" defaultValue={currentService?.fullDescription} rows={4} /></div>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <ArrayInput values={features} onChange={setFeatures} label="Features" placeholder="Add feature..." />
                                    <ArrayInput values={benefits} onChange={setBenefits} label="Benefits" placeholder="Add benefit..." />
                                </div>
                                <div className="grid gap-2"><Label>Order</Label><Input type="number" name="order" defaultValue={currentService?.order} /></div>
                            </form>
                        )}
                    </ScrollableContainer>
                    {!isViewMode && (
                        <DialogFooter className="p-6 pt-2 border-t">
                            <Button type="submit" form="service-form" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save
                            </Button>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

// 7. Testimonial Manager
function TestimonialManager({ data, onUpdate, refreshData }) {
    const [testimonials, setTestimonials] = useState(Array.isArray(data) ? data : []);

    useEffect(() => {
        if (Array.isArray(data)) setTestimonials(data);
    }, [data]);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentTestimonial, setCurrentTestimonial] = useState(null);
    const [isViewMode, setIsViewMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleOpen = (t, view) => {
        // Ensure author and content exist
        const testimonial = t ? {
            ...t,
            content: t.content || t.quote || "",
            author: t.author || { name: "", role: "", company: "", handle: "", image: "" },
        } : null;
        setCurrentTestimonial(testimonial);
        setIsViewMode(view);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id) => {
        if (confirm("Delete testimonial?")) {
            setIsLoading(true);
            try {
                const res = await deleteTestimonial(id);
                if (res.success) {
                    const updated = testimonials.filter(t => t._id !== id && t.id !== id);
                    setTestimonials(updated);
                    onUpdate(updated);
                    toast.success("Deleted");
                } else {
                    toast.error("Failed to delete");
                }
            } catch (error) {
                toast.error("Error deleting testimonial");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.target);

        const newTestimonial = {
            id: currentTestimonial ? (currentTestimonial._id || currentTestimonial.id) : undefined,
            type: "social",
            category: "General",
            content: formData.get("content").substring(0, 200),
            rating: Number(formData.get("rating")),
            featured: true,
            author: {
                name: formData.get("authorName"),
                company: formData.get("authorCompany"),
                image: formData.get("authorImage") || "https://randomuser.me/api/portraits/men/32.jpg"
            }
        };

        try {
            const savedTestimonial = await upsertTestimonial(newTestimonial);
            if (savedTestimonial) {
                // Ensure helper structures exist for UI consistency
                savedTestimonial.author = savedTestimonial.author || {};
                savedTestimonial.metric = savedTestimonial.metric || {};

                const updatedTestimonials = testimonials.some(t => t._id === savedTestimonial._id || t.id === savedTestimonial.id)
                    ? testimonials.map(t => (t._id === savedTestimonial._id || t.id === savedTestimonial.id) ? savedTestimonial : t)
                    : [...testimonials, savedTestimonial];

                const sortedTestimonials = updatedTestimonials.sort((a, b) => (a.order || 0) - (b.order || 0));

                setTestimonials(sortedTestimonials);
                onUpdate(sortedTestimonials);
                toast.success(currentTestimonial ? "Updated" : "Added");
                setIsDialogOpen(false);
                if (refreshData) refreshData(true);
            } else {
                toast.error("Failed to save testimonial");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <ChevronsUpDown className="ml-2 h-3 w-3 opacity-40 shrink-0" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="ml-2 h-3 w-3 text-primary shrink-0" />
            : <ArrowDown className="ml-2 h-3 w-3 text-primary shrink-0" />;
    };

    const sortedTestimonials = [...testimonials].sort((a, b) => {
        let aVal = a[sortConfig.key] || "";
        let bVal = b[sortConfig.key] || "";
        if (sortConfig.key === 'name') {
            aVal = a.author?.name || "";
            bVal = b.author?.name || "";
        } else if (sortConfig.key === 'company') {
            aVal = a.author?.company || "";
            bVal = b.author?.company || "";
        }
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Input placeholder="Search testimonials..." className="max-w-sm" />
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => refreshData()} title="Refresh Data">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    <Button onClick={() => handleOpen(null, false)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Testimonial
                    </Button>
                </div>
            </div>

            <div className="rounded-md border bg-card overflow-hidden">
                <ScrollableContainer maxHeight="50vh">
                    <Table wrapperClassName="overflow-visible">
                        <TableHeader className="sticky top-0 z-10 bg-card shadow-sm border-b">
                            <TableRow>
                                <TableHead className="w-[80px] font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">Image</TableHead>
                                <TableHead>
                                    <button onClick={() => handleSort('name')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                        Author {getSortIcon('name')}
                                    </button>
                                </TableHead>
                                <TableHead>
                                    <button onClick={() => handleSort('company')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                        Company {getSortIcon('company')}
                                    </button>
                                </TableHead>
                                <TableHead>
                                    <button onClick={() => handleSort('rating')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                        Rating {getSortIcon('rating')}
                                    </button>
                                </TableHead>
                                <TableHead className="text-right font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedTestimonials.map((t, index) => (
                                <TableRow key={`${t._id || t.id || 'testimonial'}-${index}`}>
                                    <TableCell>
                                        <img src={t.author?.image || undefined} className="w-10 h-10 rounded-full object-cover" alt={t.author?.name} />
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium capitalize">{t.author?.name}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm text-muted-foreground capitalize">{t.author?.company}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex text-yellow-500 text-xs">
                                            {[...Array(t.rating || 5)].map((_, i) => <span key={i}>★</span>)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpen(t, true)}><Eye className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleOpen(t, false)}><Edit className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(t._id || t.id)}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollableContainer>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-h-[85vh] flex flex-col p-0 gap-0">
                    <DialogHeader className="p-6 pb-2"><DialogTitle>{isViewMode ? "View Testimonial" : "Edit Testimonial"}</DialogTitle></DialogHeader>
                    <ScrollableContainer className="flex-1 p-6 pt-2">
                        {isViewMode ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-4"><img src={currentTestimonial?.author?.image || undefined} className="w-16 h-16 rounded-full" /><div><h4 className="text-lg font-bold capitalize">{currentTestimonial?.author?.name}</h4><p className="capitalize text-muted-foreground">{currentTestimonial?.author?.company}</p></div></div>
                                <p className="text-xl italic font-serif leading-relaxed">"{currentTestimonial?.content}"</p>
                                <div className="flex gap-4"><div><Label className="text-xs text-muted-foreground">Rating</Label><div className="flex text-yellow-500">{[...Array(currentTestimonial?.rating || 5)].map((_, i) => <span key={i}>★</span>)}</div></div></div>
                            </div>
                        ) : (
                            <form id="testimonial-form" onSubmit={handleSave} className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label>Content / Quote</Label>
                                        <span className={`text-[10px] ${(currentTestimonial?.content?.length || 0) > 200 ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                                            {(currentTestimonial?.content?.length || 0)}/200
                                        </span>
                                    </div>
                                    <Textarea
                                        name="content"
                                        defaultValue={currentTestimonial?.content}
                                        onChange={(e) => setCurrentTestimonial({ ...currentTestimonial, content: e.target.value })}
                                        required
                                        maxLength={200}
                                        placeholder="Enter client testimonial (max 200 chars)..."
                                    />
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Author Name</Label><Input name="authorName" defaultValue={currentTestimonial?.author?.name} required /></div>
                                    <div className="space-y-2"><Label>Company</Label><Input name="authorCompany" defaultValue={currentTestimonial?.author?.company} required /></div>
                                </div>
                                <div className="space-y-2">
                                    <ImagePicker
                                        name="authorImage"
                                        label="Author Image"
                                        value={currentTestimonial?.author?.image}
                                    />
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Rating (1-5)</Label><Input type="number" name="rating" min="1" max="5" defaultValue={currentTestimonial?.rating || 5} /></div>
                                </div>
                            </form>
                        )}
                    </ScrollableContainer>
                    {!isViewMode && (
                        <DialogFooter className="p-6 pt-2 border-t">
                            <Button type="submit" form="testimonial-form" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save
                            </Button>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

// 8. FAQ Manager
function FAQManager({ data, onUpdate, refreshData }) {
    const [faqs, setFaqs] = useState(Array.isArray(data) ? data : []);

    useEffect(() => {
        if (Array.isArray(data)) setFaqs(data);
    }, [data]);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentFaq, setCurrentFaq] = useState(null);
    const [isViewMode, setIsViewMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleOpen = (f, view) => {
        // Ensure categories object exists
        const faq = f ? {
            ...f,
            categories: f.categories || { home: false, pricing: false, dashboard: false }
        } : null;
        setCurrentFaq(faq);
        setIsViewMode(view);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id) => {
        if (confirm("Delete FAQ?")) {
            setIsLoading(true);
            try {
                const res = await deleteFAQ(id);
                if (res.success) {
                    const updated = faqs.filter(f => f._id !== id && f.id !== id);
                    setFaqs(updated);
                    onUpdate(updated);
                    toast.success("Deleted");
                } else {
                    toast.error("Failed to delete");
                }
            } catch (error) {
                toast.error("Error deleting FAQ");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.target);

        const newFaq = {
            id: currentFaq ? (currentFaq._id || currentFaq.id) : undefined,
            question: formData.get("question"),
            answer: formData.get("answer"),
            categories: {
                home: formData.get("cat_home") === "on",
                pricing: formData.get("cat_pricing") === "on",
                dashboard: formData.get("cat_dashboard") === "on"
            },
            order: Number(formData.get("order")) || faqs.length + 1
        };

        try {
            const savedFaq = await upsertFAQ(newFaq);
            if (savedFaq) {
                // Ensure helper structures exist for UI consistency
                savedFaq.categories = savedFaq.categories || { home: false, pricing: false, dashboard: false };

                const updatedFaqs = faqs.some(f => f._id === savedFaq._id || f.id === savedFaq.id)
                    ? faqs.map(f => (f._id === savedFaq._id || f.id === savedFaq.id) ? savedFaq : f)
                    : [...faqs, savedFaq];

                const sortedFaqs = updatedFaqs.sort((a, b) => (a.order || 0) - (b.order || 0));

                setFaqs(sortedFaqs);
                onUpdate(sortedFaqs);
                toast.success(currentFaq ? "Updated" : "Added");
                setIsDialogOpen(false);
                if (refreshData) refreshData(true);
            } else {
                toast.error("Failed to save FAQ");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex gap-1">
                    <Badge variant="outline">Total FAQs: {faqs.length}</Badge>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => refreshData()} title="Refresh Data">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    <Button onClick={() => handleOpen(null, false)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add FAQ
                    </Button>
                </div>
            </div>
            <div className="rounded-md border bg-card overflow-hidden">
                <ScrollableContainer maxHeight="50vh" className="p-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        {faqs.map((f, index) => (
                            <div key={`${f._id || f.id || 'faq'}-${index}`} className="p-4 rounded-lg border bg-card flex justify-between group h-fit">
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-medium capitalize">{f.question}</h4>
                                        <div className="flex gap-1">
                                            {f.categories?.home && <Badge variant="secondary" className="text-xs">Home</Badge>}
                                            {f.categories?.pricing && <Badge variant="secondary" className="text-xs">Pricing</Badge>}
                                            {f.categories?.dashboard && <Badge variant="secondary" className="text-xs">Dashboard</Badge>}
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{f.answer}</p>
                                </div>
                                <div className="flex gap-1 items-start pl-4">
                                    <Button variant="ghost" size="icon" onClick={() => handleOpen(f, true)}><Eye className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleOpen(f, false)}><Edit className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(f._id || f.id)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollableContainer>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-h-[85vh] flex flex-col p-0 gap-0">
                    <DialogHeader className="p-6 pb-2"><DialogTitle>{isViewMode ? "View FAQ" : "Edit FAQ"}</DialogTitle></DialogHeader>
                    <ScrollableContainer className="flex-1 p-6 pt-2">
                        {isViewMode ? (
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold capitalize">{currentFaq?.question}</h3>
                                <p className="text-muted-foreground">{currentFaq?.answer}</p>
                                <div className="flex gap-2">
                                    {currentFaq?.categories?.home && <Badge>Home</Badge>}
                                    {currentFaq?.categories?.pricing && <Badge>Pricing</Badge>}
                                    {currentFaq?.categories?.dashboard && <Badge>Dashboard</Badge>}
                                </div>
                            </div>
                        ) : (
                            <form id="faq-form" onSubmit={handleSave} className="space-y-4">
                                <div className="space-y-2"><Label>Question</Label><Input name="question" defaultValue={currentFaq?.question} required /></div>
                                <div className="space-y-2"><Label>Answer</Label><Textarea name="answer" defaultValue={currentFaq?.answer} required /></div>
                                <div className="space-y-2">
                                    <Label>Show On:</Label>
                                    <div className="flex gap-4">
                                        <div className="flex items-center space-x-2"><Checkbox id="cat_home" name="cat_home" defaultChecked={currentFaq?.categories?.home} /><Label htmlFor="cat_home">Home</Label></div>
                                        <div className="flex items-center space-x-2"><Checkbox id="cat_pricing" name="cat_pricing" defaultChecked={currentFaq?.categories?.pricing} /><Label htmlFor="cat_pricing">Pricing</Label></div>
                                        <div className="flex items-center space-x-2"><Checkbox id="cat_dashboard" name="cat_dashboard" defaultChecked={currentFaq?.categories?.dashboard} /><Label htmlFor="cat_dashboard">Dashboard</Label></div>
                                    </div>
                                </div>
                                <div className="space-y-2"><Label>Order</Label><Input type="number" name="order" defaultValue={currentFaq?.order} /></div>
                            </form>
                        )}
                    </ScrollableContainer>
                    {!isViewMode && (
                        <DialogFooter className="p-6 pt-2 border-t">
                            <Button type="submit" form="faq-form" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save
                            </Button>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

// 9. Job Manager
function JobManager({ data, onUpdate, refreshData }) {
    const [jobs, setJobs] = useState(Array.isArray(data) ? data : []);

    useEffect(() => {
        if (Array.isArray(data)) setJobs(data);
    }, [data]);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentJob, setCurrentJob] = useState(null);
    const [isViewMode, setIsViewMode] = useState(false);
    const [requirements, setRequirements] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleOpen = (j, view) => {
        setCurrentJob(j);
        setIsViewMode(view);
        setRequirements(j?.requirements || []);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id) => {
        if (confirm("Delete job posting?")) {
            setIsLoading(true);
            try {
                const res = await deleteJob(id);
                if (res.success) {
                    const updated = jobs.filter(j => j._id !== id && j.id !== id);
                    setJobs(updated);
                    onUpdate(updated);
                    toast.success("Deleted");
                } else {
                    toast.error("Failed to delete");
                }
            } catch (error) {
                toast.error("Error deleting job");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.target);

        const newJob = {
            id: currentJob ? (currentJob._id || currentJob.id) : undefined,
            title: formData.get("title"),
            department: formData.get("department"),
            location: formData.get("location"),
            type: formData.get("type"),
            experience: formData.get("experience"),
            description: formData.get("description"),
            requirements: requirements
        };

        try {
            const savedJob = await upsertJob(newJob);
            if (savedJob) {
                const updatedJobs = jobs.some(j => j._id === savedJob._id || j.id === savedJob.id)
                    ? jobs.map(j => (j._id === savedJob._id || j.id === savedJob.id) ? savedJob : j)
                    : [...jobs, savedJob];

                setJobs(updatedJobs);
                onUpdate(updatedJobs);
                toast.success(currentJob ? "Updated" : "Created");
                setIsDialogOpen(false);
                if (refreshData) refreshData(true);
            } else {
                toast.error("Failed to save job");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const [sortConfig, setSortConfig] = useState({ key: "title", direction: "asc" });

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <ChevronsUpDown className="ml-2 h-3 w-3 opacity-40 shrink-0" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="ml-2 h-3 w-3 text-primary shrink-0" />
            : <ArrowDown className="ml-2 h-3 w-3 text-primary shrink-0" />;
    };

    const sortedJobs = [...jobs].sort((a, b) => {
        let aVal = a[sortConfig.key] || "";
        let bVal = b[sortConfig.key] || "";
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex gap-1">
                    <Badge variant="outline">Open Roles: {jobs.length}</Badge>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => refreshData()} title="Refresh Data">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    <Button onClick={() => handleOpen(null, false)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Post Job
                    </Button>
                </div>
            </div>
            <div className="rounded-md border bg-card overflow-hidden">
                <ScrollableContainer maxHeight="50vh">
                    <Table wrapperClassName="overflow-visible">
                        <TableHeader className="sticky top-0 z-10 bg-card shadow-sm border-b">
                            <TableRow>
                                <TableHead>
                                    <button onClick={() => handleSort('title')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                        Position {getSortIcon('title')}
                                    </button>
                                </TableHead>
                                <TableHead>
                                    <button onClick={() => handleSort('department')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                        Department {getSortIcon('department')}
                                    </button>
                                </TableHead>
                                <TableHead>
                                    <button onClick={() => handleSort('type')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                        Type {getSortIcon('type')}
                                    </button>
                                </TableHead>
                                <TableHead className="text-right font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedJobs.map((j, index) => (
                                <TableRow key={`${j._id || j.id || 'job'}-${index}`}>
                                    <TableCell className="font-medium capitalize">{j.title}</TableCell>
                                    <TableCell className="capitalize">{j.department}</TableCell>
                                    <TableCell><Badge variant="secondary">{j.type}</Badge></TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpen(j, true)}><Eye className="w-4 h-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleOpen(j, false)}><Edit className="w-4 h-4" /></Button>
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(j._id || j.id)}><Trash2 className="w-4 h-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollableContainer>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
                    <DialogHeader className="p-6 pb-2"><DialogTitle>{isViewMode ? "View Job" : "Edit Job"}</DialogTitle></DialogHeader>
                    <ScrollableContainer className="flex-1 p-6 pt-2">
                        {isViewMode ? (
                            <div className="space-y-4">
                                <div className="flex justify-between items-start"><div><h2 className="text-xl font-bold capitalize">{currentJob?.title}</h2><p className="text-muted-foreground capitalize">{currentJob?.department} • {currentJob?.location}</p></div><Badge>{currentJob?.type}</Badge></div>
                                <div><Label>Description</Label><p className="text-sm">{currentJob?.description}</p></div>
                                <div><Label>Requirements</Label><ul className="list-disc pl-4 text-sm">{currentJob?.requirements?.map((r, i) => <li key={i}>{r}</li>)}</ul></div>
                            </div>
                        ) : (
                            <form id="job-form" onSubmit={handleSave} className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4"><div className="space-y-2"><Label>Title</Label><Input name="title" defaultValue={currentJob?.title} required /></div><div className="space-y-2"><Label>Department</Label><Input name="department" defaultValue={currentJob?.department} required /></div></div>
                                <div className="grid md:grid-cols-3 gap-4"><div className="space-y-2"><Label>Location</Label><Input name="location" defaultValue={currentJob?.location} required /></div><div className="space-y-2"><Label>Type</Label><Input name="type" defaultValue={currentJob?.type} required /></div><div className="space-y-2"><Label>Experience</Label><Input name="experience" defaultValue={currentJob?.experience} /></div></div>
                                <div className="space-y-2"><Label>Description</Label><Textarea name="description" defaultValue={currentJob?.description} rows={3} /></div>
                                <ArrayInput values={requirements} onChange={setRequirements} label="Requirements" placeholder="Requirement..." />
                            </form>
                        )}
                    </ScrollableContainer>
                    {!isViewMode && (
                        <DialogFooter className="p-6 pt-2 border-t">
                            <Button type="submit" form="job-form" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save
                            </Button>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

// 10. Legal Manager
function LegalManager() {
    const [privacyPolicy, setPrivacyPolicy] = useState({ slug: 'privacy-policy', title: 'Privacy Policy', content: '' });
    const [termsConditions, setTermsConditions] = useState({ slug: 'terms-conditions', title: 'Terms & Conditions', content: '' });
    const [refundPolicy, setRefundPolicy] = useState({ slug: 'refund-policy', title: 'Refund Policy', content: '' });
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const loadPages = useCallback(async () => {
        setLoading(true);
        try {
            const [privacy, terms, refund] = await Promise.all([
                getWebPage('privacy-policy'),
                getWebPage('terms-conditions'),
                getWebPage('refund-policy')
            ]);
            if (privacy) setPrivacyPolicy(privacy);
            if (terms) setTermsConditions(terms);
            if (refund) setRefundPolicy(refund);
        } catch (error) {
            console.error("Failed to load legal pages", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPages();
    }, [loadPages]);

    const handleSave = async (slug, data) => {
        setIsSaving(true);
        try {
            const res = await upsertWebPage({ ...data, slug });
            if (res) {
                toast.success(`${data.title} updated successfully`);
                if (slug === 'privacy-policy') setPrivacyPolicy(res);
                else if (slug === 'terms-conditions') setTermsConditions(res);
                else setRefundPolicy(res);
            } else {
                toast.error(`Failed to update ${data.title}`);
            }
        } catch (error) {
            toast.error("An error occurred during save");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12">
                <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground text-sm">Loading legal content...</p>
            </div>
        );
    }

    const quillModules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link', 'image', 'code-block'],
            ['clean']
        ]
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Tabs defaultValue="privacy" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto mb-8">
                    <TabsTrigger value="privacy" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" /> Privacy Policy
                    </TabsTrigger>
                    <TabsTrigger value="terms" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Terms & Conditions
                    </TabsTrigger>
                    <TabsTrigger value="refund" className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" /> Refund Policy
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="privacy" className="space-y-4">
                    <Card className="border-primary/10 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-primary" />
                                Privacy Policy Editor
                            </CardTitle>
                            <CardDescription>
                                This content will be dynamically displayed on the Privacy Policy page.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-2">
                                <Label htmlFor="pp-title">Display Title</Label>
                                <Input
                                    id="pp-title"
                                    value={privacyPolicy.title}
                                    onChange={(e) => setPrivacyPolicy({ ...privacyPolicy, title: e.target.value })}
                                    placeholder="e.g. Privacy Policy"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Page Content (Rich Text)</Label>
                                <div className="min-h-[500px] rounded-md border bg-background">
                                    <ReactQuill
                                        theme="snow"
                                        value={privacyPolicy.content}
                                        onChange={(val) => setPrivacyPolicy({ ...privacyPolicy, content: val })}
                                        modules={quillModules}
                                        className="h-[450px] mb-12"
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t bg-muted/50 p-6">
                            <Button
                                onClick={() => handleSave('privacy-policy', privacyPolicy)}
                                disabled={isSaving}
                                className="ml-auto"
                            >
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Privacy Policy
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="terms" className="space-y-4">
                    <Card className="border-primary/10 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Terms & Conditions Editor
                            </CardTitle>
                            <CardDescription>
                                This content will be dynamically displayed on the Terms & Conditions page.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-2">
                                <Label htmlFor="tc-title">Display Title</Label>
                                <Input
                                    id="tc-title"
                                    value={termsConditions.title}
                                    onChange={(e) => setTermsConditions({ ...termsConditions, title: e.target.value })}
                                    placeholder="e.g. Terms & Conditions"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Page Content (Rich Text)</Label>
                                <div className="min-h-[500px] rounded-md border bg-background">
                                    <ReactQuill
                                        theme="snow"
                                        value={termsConditions.content}
                                        onChange={(val) => setTermsConditions({ ...termsConditions, content: val })}
                                        modules={quillModules}
                                        className="h-[450px] mb-12"
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t bg-muted/50 p-6">
                            <Button
                                onClick={() => handleSave('terms-conditions', termsConditions)}
                                disabled={isSaving}
                                className="ml-auto"
                            >
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Terms & Conditions
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
                <TabsContent value="refund" className="space-y-4">
                    <Card className="border-primary/10 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <RefreshCw className="h-5 w-5 text-primary" />
                                Refund Policy Editor
                            </CardTitle>
                            <CardDescription>
                                This content will be dynamically displayed on the Refund Policy page.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-2">
                                <Label htmlFor="rp-title">Display Title</Label>
                                <Input
                                    id="rp-title"
                                    value={refundPolicy.title}
                                    onChange={(e) => setRefundPolicy({ ...refundPolicy, title: e.target.value })}
                                    placeholder="e.g. Refund Policy"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Page Content (Rich Text)</Label>
                                <div className="min-h-[500px] rounded-md border bg-background">
                                    <ReactQuill
                                        theme="snow"
                                        value={refundPolicy.content}
                                        onChange={(val) => setRefundPolicy({ ...refundPolicy, content: val })}
                                        modules={quillModules}
                                        className="h-[450px] mb-12"
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t bg-muted/50 p-6">
                            <Button
                                onClick={() => handleSave('refund-policy', refundPolicy)}
                                disabled={isSaving}
                                className="ml-auto"
                            >
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Refund Policy
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
