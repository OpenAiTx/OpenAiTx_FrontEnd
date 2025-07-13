import { useState, useEffect, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ChevronDown, ChevronUp } from "lucide-react";
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogFooter, 
    DialogHeader, 
    DialogTitle 
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { getAppUrl } from '../lib/utils';
import Stepper from '../components/ui/stepper';
import ProjectsShowcase from '../components/ProjectsShowcase';

/* global URL, URLSearchParams */

// LanguageLinks component - adapted for dark theme
const LanguageLinks = () => {
    const languages = [
        "English",
        "简体中文",
        "繁體中文",
        "日本語",
        "한국어",
        "हिन्दी",
        "ไทย",
        "Français",
        "Deutsch",
        "Español",
        "Italiano",
        "Русский",
        "Português",
        "Nederlands",
        "Polski",
        "فارسی",
        "العربية",
        "Türkçe",
        "Tiếng Việt",
        "Bahasa Indonesia",
    ];

    return (
        <div className="text-sm mb-4 leading-relaxed">
            {languages.map((lang, index) => (
                <span key={lang}>
                    <a href="#" className="hover:underline transition-all no-underline" style={{ color: "#0366d6" }}>
                        {lang}
                    </a>
                    {index < languages.length - 1 && <span> | </span>}
                </span>
            ))}
        </div>
    );
};

const BadgeGenerator = () => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const [userOrOrg, setUserOrOrg] = useState("");
    const [project, setProject] = useState("");
    const [copiedItem, setCopiedItem] = useState(null);
    const [showSubmitButton, setShowSubmitButton] = useState(false);
    const [repoNotFound, setRepoNotFound] = useState(false);
    const [repoUrl, setRepoUrl] = useState("");
    const [urlError, setUrlError] = useState("");
    const [isCheckingProject, setIsCheckingProject] = useState(false);
    const [isStyle2Expanded, setIsStyle2Expanded] = useState(false);
    const [isStyle3Expanded, setIsStyle3Expanded] = useState(false);
    
    // Dialog state management
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogType, setDialogType] = useState(''); // 'success' or 'error'
    const [dialogErrorMessage, setDialogErrorMessage] = useState('');

    // Stepper steps definition
    const steps = [
        { id: 'search', title: t('badge.stepSearch') },
        { id: 'submit', title: t('badge.stepSubmit') },
        { id: 'copy', title: t('badge.stepCopy') },
        { id: 'view', title: t('badge.stepView') }
    ];

    const style1Languages = [
        { code: "en", name: "EN" },
        { code: "zh-CN", name: "简中" },
        { code: "zh-TW", name: "繁中" },
        { code: "ja", name: "日本語" },
        { code: "ko", name: "한국어" },
        { code: "th", name: "ไทย" },
        { code: "fr", name: "Français" },
        { code: "de", name: "Deutsch" },
        { code: "es", name: "Español" },
        { code: "it", name: "Italiano" },
        { code: "ru", name: "Русский" },
        { code: "pt", name: "Português" },
        { code: "nl", name: "Nederlands" },
        { code: "pl", name: "Polski" },
        { code: "ar", name: "العربية" },
        { code: "tr", name: "Türkçe" },
        { code: "vi", name: "Tiếng Việt" },
    ];

    const style2Languages = [
        { code: "en", name: "English" },
        { code: "zh-CN", name: "简体中文" },
        { code: "zh-TW", name: "繁體中文" },
        { code: "ja", name: "日本語" },
        { code: "ko", name: "한국어" },
        { code: "hi", name: "हिन्दी" },
        { code: "th", name: "ไทย" },
        { code: "fr", name: "Français" },
        { code: "de", name: "Deutsch" },
        { code: "es", name: "Español" },
        { code: "it", name: "Italiano" },
        { code: "ru", name: "Русский" },
        { code: "pt", name: "Português" },
        { code: "nl", name: "Nederlands" },
        { code: "pl", name: "Polski" },
        { code: "ar", name: "العربية" },
        { code: "fa", name: "فارسی" },
        { code: "tr", name: "Türkçe" },
        { code: "vi", name: "Tiếng Việt" },
        { code: "id", name: "Bahasa Indonesia" },
    ];

    useEffect(() => {
        // Get URL parameters on load
        const userParam = searchParams.get("userOrOrg");
        const projectParam = searchParams.get("project");

        if (userParam) setUserOrOrg(userParam);
        if (projectParam) setProject(projectParam);

        // Check project status if both parameters exist
        if (userParam && projectParam) {
            checkProjectStatus(userParam, projectParam);
        }
    }, [searchParams]);

    const checkProjectStatus = async (user, proj) => {
        setIsCheckingProject(true);
        try {
            // Check if GitHub repository exists
            const githubApiUrl = `https://api.github.com/repos/${user}/${proj}`;
            const repoResponse = await fetch(githubApiUrl);
            const repoData = await repoResponse.json();

            if (repoData.message === "Not Found") {
                setRepoNotFound(true);
                return;
            }

            // Check if project is in OpenAiTx repository
            const apiUrl = `https://raw.githubusercontent.com/OpenAiTx/OpenAiTx/refs/heads/main/projects/${user}/${proj}/README-en.md`;
            const response = await fetch(apiUrl);

            if (response.status === 404) {
                setShowSubmitButton(true);
            }
        } catch (error) {
            console.error("Error checking project status:", error);
        } finally {
            setIsCheckingProject(false);
        }
    };

    const generateStyle1Html = () => {
        if (!userOrOrg || !project) return "";

        const appUrl = getAppUrl();
        const badges = style1Languages.map((lang) => `<a href="${appUrl}/view?user=${userOrOrg}&project=${project}&lang=${lang.code}"><img src="https://img.shields.io/badge/${lang.name}-white" alt="version"></a>`).join("");

        return `<div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 8px;">${badges}</div>`;
    };

    const generateStyle2Markdown = () => {
        if (!userOrOrg || !project) return "";

        const appUrl = getAppUrl();
        return style2Languages.map((lang) => `[${lang.name}](${appUrl}/view?user=${userOrOrg}&project=${project}&lang=${lang.code})`).join(" | ");
    };

    const generateStyle3Dropdown = () => {
        if (!userOrOrg || !project) return "";

        const appUrl = getAppUrl();
        const languageLinks = style2Languages.map((lang) => `[${lang.name}](${appUrl}/view?user=${userOrOrg}&project=${project}&lang=${lang.code})`).join(" | ");
        
        return `<details>
<summary>🌐 Language</summary>

${languageLinks}

</details>`;
    };

    const copyToClipboard = async (text, itemId) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedItem(itemId);
            setTimeout(() => setCopiedItem(null), 2000);
            toast.success(t("badge.alertCopied"));
        } catch (err) {
            console.error("Failed to copy: ", err);
            toast.error("Failed to copy to clipboard");
        }
    };

    const submitProject = async () => {
        try {
            const response = await fetch("https://openaitx.com/api/submit-project", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    project: `https://github.com/${userOrOrg}/${project}`,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            // Show success dialog
            setDialogType('success');
            setDialogOpen(true);
            
        } catch (error) {
            // Show failure dialog
            setDialogType('error');
            setDialogErrorMessage(error.message);
            setDialogOpen(true);
        }
    };

    // Parse GitHub URL
    const parseGitHubUrl = (url) => {
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname !== "github.com") {
                return { error: t("badge.invalidGitHubUrl") };
            }

            const pathParts = urlObj.pathname.split("/").filter(Boolean);
            if (pathParts.length < 2) {
                return { error: t("badge.invalidRepoUrl") };
            }

            return {
                userOrOrg: pathParts[0],
                project: pathParts[1],
            };
        } catch {
            return { error: t("badge.invalidUrl") };
        }
    };

    // Handle URL submission
    const handleUrlSubmit = async () => {
        setUrlError("");
        const result = parseGitHubUrl(repoUrl);

        if (result.error) {
            setUrlError(result.error);
            return;
        }

        // Update URL parameters
        const newParams = new URLSearchParams();
        newParams.set("userOrOrg", result.userOrOrg);
        newParams.set("project", result.project);

        // Update URL using hash router format
        window.history.pushState({}, "", `#/?${newParams.toString()}`);

        // Update state
        setUserOrOrg(result.userOrOrg);
        setProject(result.project);

        // Check project status
        await checkProjectStatus(result.userOrOrg, result.project);
    };

    // Handle repository reset
    const handleResetRepo = () => {
        // Reset all states
        setRepoUrl("");
        setUserOrOrg("");
        setProject("");
        setRepoNotFound(false);
        setShowSubmitButton(false);
        setUrlError("");
        setIsCheckingProject(false);
        
        // Clear URL parameters, return to homepage
        window.history.pushState({}, "", "#/");
    };

    // Animation configuration
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
            },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 12,
            },
        },
    };

    return (
        <>
            {/* Submission Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="p-8 sm:max-w-md">
                    <DialogHeader >
                        <DialogTitle>
                            {dialogType === 'success' 
                                ? t("badge.dialogSubmissionSuccess")
                                : t("badge.dialogSubmissionFailed")
                            }
                        </DialogTitle>
                        <DialogDescription className="py-6">
                            {dialogType === 'success' 
                                ? t("badge.dialogSuccessContent")
                                : t("badge.dialogFailedContent", { errorMessage: dialogErrorMessage })
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button 
                            onClick={() => setDialogOpen(false)}
                            className="w-full"
                        >
                            {t("badge.dialogConfirm")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <motion.div className="max-w-4xl mx-auto" variants={containerVariants} initial="hidden" animate="visible">
                {/* Header */}
                <motion.div className="text-center mb-10 mt-6" variants={itemVariants}>
                    <motion.h1 className="text-2xl font-bold text-foreground mb-4" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }}>
                        {t("badge.title")}
                    </motion.h1>
                </motion.div>

                {/* Stepper */}
                <motion.div className="mb-8" variants={itemVariants}>
                    <Stepper steps={steps} />
                </motion.div>

            {/* Hidden inputs for URL parameters */}
            <input type="hidden" value={userOrOrg} />
            <input type="hidden" value={project} />

            {/* Repository Not Found Message */}
            {repoNotFound && (
                <motion.div className="text-center p-6 mb-6 bg-muted/30 rounded-lg border border-border" variants={itemVariants} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 100 }}>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{t("badge.repoNotFound")}</h3>
                    <p className="text-muted-foreground">{t("badge.repoNotFoundDesc")}</p>
                </motion.div>
            )}

            {/* GitHub URL Input */}
            <motion.div className="text-center p-6 mb-6 bg-muted/30 rounded-lg border border-border" variants={itemVariants} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 100 }}>
                {!userOrOrg || !project ? (
                    <Fragment>
                        <h3 className="text-lg font-semibold text-foreground mb-2">{t("badge.enterGitHubUrl")}</h3>
                        <p className="text-muted-foreground mb-4">{t("badge.enterGitHubUrlDesc")}</p>
                        <div className="flex gap-2 max-w-xl mx-auto">
                            <input
                                type="text"
                                value={repoUrl}
                                onChange={(e) => setRepoUrl(e.target.value)}
                                placeholder={t("badge.githubUrlPlaceholder")}
                                className="flex-1 px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                            />
                            <motion.button onClick={handleUrlSubmit} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                {t("badge.search")}
                            </motion.button>
                        </div>
                        {urlError && (
                            <motion.p className="mt-2 text-sm text-destructive" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                                {urlError}
                            </motion.p>
                        )}
                    </Fragment>
                ) : (
                    <motion.button
                        onClick={handleResetRepo}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {t("badge.changeRepo")}
                    </motion.button>
                )}
            </motion.div>
            {!urlError && userOrOrg && project && (
                <motion.div className="my-10 flex gap-8 text-sm" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <div className="text-muted-foreground text-xl">
                        {t("badge.githubUser")}: <span className="text-foreground font-medium">{userOrOrg}</span>
                    </div>
                    <div className="text-muted-foreground text-xl">
                        {t("badge.projectName")}: <span className="text-foreground font-medium">{project}</span>
                    </div>
                </motion.div>
            )}

            {/* Loading State */}
            {isCheckingProject && userOrOrg && project && (
                <motion.div className="text-center p-6 mb-6 bg-muted/30 rounded-lg border border-border" variants={itemVariants} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 100 }}>
                    <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span className="text-lg text-foreground">{t("badge.checking")}</span>
                    </div>
                </motion.div>
            )}

            {/* Submit Project Button */}
            {showSubmitButton && (
                <motion.div className="text-center p-6 mb-6 bg-muted/30 rounded-lg border border-border" variants={itemVariants} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 100 }}>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{t("badge.docNotFound")}</h3>
                    <p className="text-muted-foreground mb-4">{t("badge.docNotFoundDesc")}</p>
                    <motion.button onClick={submitProject} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        {t("badge.submit")}
                    </motion.button>
                </motion.div>
            )}

            {/* Translation Completed Title */}
            {!repoNotFound && userOrOrg && project && !isCheckingProject && !showSubmitButton && (
                <Fragment>
                    <motion.div className="text-center my-8" variants={itemVariants}>
                        <motion.h1 className="text-3xl font-bold text-foreground mb-2" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
                            {t("badge.translationCompleted")}
                        </motion.h1>
                        <motion.h4 className="text-lg text-muted-foreground" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
                            {t("badge.copyLinksToReadme")}
                        </motion.h4>
                    </motion.div>

            {/* Style Option 1 (HTML Badges) */}
                    <motion.div className="border border-border p-5 mb-5 rounded-md bg-muted/70" variants={itemVariants} whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                        <h2 className="text-xl font-semibold text-card-foreground mb-4">{t("badge.style1")}</h2>
                        <div className="bg-muted/30 p-4 mb-3 rounded text-center">
                            <div dangerouslySetInnerHTML={{ __html: generateStyle1Html() }} />
                        </div>
                        <motion.button
                            onClick={() => copyToClipboard(generateStyle1Html(), "style1")}
                            className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}>
                            {copiedItem === "style1" ? t("badge.copied") : t("badge.copyHtml")}
                        </motion.button>
                    </motion.div>

                    {/* Style Option 2 (Markdown Links) */}
                    <motion.div className="border border-border p-5 mb-5 rounded-md bg-muted/70" variants={itemVariants} whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-card-foreground">{t("badge.style2")}</h2>
                            <motion.button
                                onClick={() => setIsStyle2Expanded(!isStyle2Expanded)}
                                className="p-1 hover:bg-muted/50 rounded transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {isStyle2Expanded ? (
                                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                ) : (
                                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                )}
                            </motion.button>
                        </div>
                        <LanguageLinks />
                        <AnimatePresence mode="wait">
                            {isStyle2Expanded && (
                                <motion.div
                                    key="style2-content"
                                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                    animate={{ 
                                        opacity: 1, 
                                        height: "auto", 
                                        marginBottom: 12,
                                        transition: { 
                                            duration: 0.3,
                                            ease: "easeInOut"
                                        }
                                    }}
                                    exit={{ 
                                        opacity: 0, 
                                        height: 0, 
                                        marginBottom: 0,
                                        transition: { 
                                            duration: 0.3,
                                            ease: "easeInOut"
                                        }
                                    }}
                                    style={{ overflow: "hidden" }}
                                >
                                    <div className="bg-muted/30 p-4 rounded whitespace-pre-wrap break-all text-sm text-muted-foreground">{generateStyle2Markdown()}</div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <motion.button
                            onClick={() => copyToClipboard(generateStyle2Markdown(), "style2")}
                            className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}>
                            {copiedItem === "style2" ? t("badge.copied") : t("badge.copyMarkdown")}
                        </motion.button>
                    </motion.div>

                    {/* Style Option 3 (Dropdown Menu) */}
                    <motion.div className="border border-border p-5 mb-5 rounded-md bg-muted/70" variants={itemVariants} whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                        <h2 className="text-xl font-semibold text-card-foreground mb-4">{t("badge.style3")}</h2>
                        <div className="bg-muted/30 p-4 mb-3 rounded">
                            <div className="flex items-center space-x-2">
                                <span className="text-2xl">🌐</span>
                                <motion.button
                                    onClick={() => setIsStyle3Expanded(!isStyle3Expanded)}
                                    className="flex items-center space-x-1 text-lg font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <span>Language</span>
                                    {isStyle3Expanded ? (
                                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </motion.button>
                            </div>
                            <AnimatePresence mode="wait">
                                {isStyle3Expanded && (
                                    <motion.div
                                        key="style3-content"
                                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                        animate={{ 
                                            opacity: 1, 
                                            height: "auto", 
                                            marginTop: 16,
                                            transition: { 
                                                duration: 0.3,
                                                ease: "easeInOut"
                                            }
                                        }}
                                        exit={{ 
                                            opacity: 0, 
                                            height: 0, 
                                            marginTop: 0,
                                            transition: { 
                                                duration: 0.3,
                                                ease: "easeInOut"
                                            }
                                        }}
                                        style={{ overflow: "hidden" }}
                                    >
                                        <div className="pt-4 border-t border-border">
                                            <LanguageLinks />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <motion.button
                            onClick={() => copyToClipboard(generateStyle3Dropdown(), "style3")}
                            className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}>
                            {copiedItem === "style3" ? t("badge.copied") : t("badge.copyDropdown")}
                        </motion.button>
                    </motion.div>
                </Fragment>
            )}
            {/* Projects Showcase Section */}
            {!(!repoNotFound && userOrOrg && project && !isCheckingProject && !showSubmitButton) && (
                <motion.div className="mt-16" variants={itemVariants}>
                    <ProjectsShowcase />
                </motion.div>
            )}
        </motion.div>
        
        </>
    );
};

export default BadgeGenerator;
