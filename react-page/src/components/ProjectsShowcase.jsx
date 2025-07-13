import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Star, Calendar, HardDrive, RefreshCw } from "lucide-react";

const ProjectsShowcase = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [allProjects, setAllProjects] = useState([]);
    const [displayedProjects, setDisplayedProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const loadMoreRef = useRef(null);

    // Animation variants
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

    const cardVariants = {
        hidden: { scale: 0.9, opacity: 0 },
        visible: {
            scale: 1,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 15,
            },
        },
        hover: {
            scale: 1.02,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 20,
            },
        },
    };

    // Check if device is mobile
    const checkIsMobile = useCallback(() => {
        setIsMobile(window.innerWidth < 768);
    }, []);

    // Get items per page count
    const getItemsPerPage = useCallback(() => {
        return isMobile ? 6 : 12;
    }, [isMobile]);

    // Load more projects
    const loadMoreProjects = useCallback(() => {
        if (loadingMore || !hasMore) return;

        setLoadingMore(true);
        const itemsPerPage = getItemsPerPage();
        const currentLength = displayedProjects.length;
        const nextItems = allProjects.slice(currentLength, currentLength + itemsPerPage);
        
        setTimeout(() => {
            setDisplayedProjects(prev => [...prev, ...nextItems]);
            setHasMore(currentLength + nextItems.length < allProjects.length);
            setLoadingMore(false);
        }, 500); // Add a slight delay to show loading effect
    }, [allProjects, displayedProjects.length, getItemsPerPage, hasMore, loadingMore]);

    // Set up Intersection Observer to monitor scrolling and trigger load more
    useEffect(() => {
        if (!loadMoreRef.current || !hasMore || loadingMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMoreProjects();
                }
            },
            {
                threshold: 0.1,
                rootMargin: '100px'
            }
        );

        observer.observe(loadMoreRef.current);

        return () => {
            if (loadMoreRef.current) {
                observer.unobserve(loadMoreRef.current);
            }
        };
    }, [hasMore, loadingMore, loadMoreProjects]);

    // Load project data
    const loadProjectsShowcase = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Get project data
            const response = await fetch(
                "https://raw.githubusercontent.com/OpenAiTx/OpenAiTx/refs/heads/main/projects/openaitx_projects_sorted.json"
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Use all projects returned from backend
            setAllProjects(data);
            
            // Initial load of first page
            const itemsPerPage = getItemsPerPage();
            const initialProjects = data.slice(0, itemsPerPage);
            setDisplayedProjects(initialProjects);
            setHasMore(data.length > itemsPerPage);
        } catch (err) {
            console.error("Error loading projects:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [getItemsPerPage]);

    // Initial load and window size monitoring
    useEffect(() => {
        checkIsMobile();
        loadProjectsShowcase();
        
        const handleResize = () => {
            checkIsMobile();
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [checkIsMobile, loadProjectsShowcase]);

    // Format star count
    const formatStarCount = (count) => {
        if (count >= 1000) {
            return (count / 1000).toFixed(1) + "k";
        }
        return count.toString();
    };

    // Format file size
    const formatBytes = (bytes) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    // Project card component
    const ProjectCard = ({ project }) => {
        const handleCardClick = () => {
            // Extract user and project from FullName (format: "user/project")
            const [user, projectName] = project.FullName.split('/');
            // Navigate to view page with parameters
            navigate(`/view?user=${user}&project=${projectName}&lang=en`);
        };

        return (
            <motion.div
                variants={cardVariants}
                whileHover="hover"
                className="h-full"
            >
                <Card 
                    className="h-full flex flex-col transition-all duration-300 hover:shadow-lg border-border bg-card cursor-pointer"
                    onClick={handleCardClick}
                >
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">
                            <span className="text-primary hover:underline truncate">
                                {project.FullName}
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between">
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                            <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-current" />
                                <span>{formatStarCount(project.StargazersCount)}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
                            <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{t("projects.updated")}: {formatDate(project.IndexTime)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <HardDrive className="h-3 w-3" />
                                <span>{formatBytes(project.Size)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        );
    };

    // Loading state
    if (loading) {
        return (
            <motion.div
                className="max-w-6xl mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                        {t("projects.title")}
                    </h2>
                </div>
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                    <p className="text-muted-foreground">{t("projects.loading")}</p>
                </div>
            </motion.div>
        );
    }

    // Error state
    if (error) {
        return (
            <motion.div
                className="max-w-6xl mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                        {t("projects.title")}
                    </h2>
                </div>
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="text-center">
                        <p className="text-destructive mb-4">{t("projects.loadError")}</p>
                        <Button
                            onClick={loadProjectsShowcase}
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className="h-4 w-4" />
                            {t("projects.retry")}
                        </Button>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            className="max-w-6xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Title */}
            <motion.div className="text-center mb-8" variants={itemVariants}>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                    {t("projects.title")} 
                </h2>
                <p className="text-muted-foreground">
                    {t("projects.description")}
                </p>
            </motion.div>

            {/* Project grid */}
            <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={containerVariants}
            >
                {displayedProjects.map((project, index) => (
                    <motion.div
                        key={project.FullName}
                        variants={itemVariants}
                        custom={index}
                    >
                        <ProjectCard project={project} />
                    </motion.div>
                ))}
            </motion.div>

            {/* Load more trigger (hidden element for triggering scroll loading) */}
            {hasMore && !loading && !error && (
                <div
                    ref={loadMoreRef}
                    className="flex justify-center items-center mt-8 py-4"
                >
                    {loadingMore && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                            <span>{t("projects.loadingMore")}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Empty state */}
            {displayedProjects.length === 0 && !loading && !error && (
                <motion.div
                    className="text-center py-12"
                    variants={itemVariants}
                >
                    <p className="text-muted-foreground">
                        {t("projects.noProjects")}
                    </p>
                </motion.div>
            )}
        </motion.div>
    );
};

export default ProjectsShowcase; 