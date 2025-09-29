import { motion } from "framer-motion";

interface SectionHeaderProps {
    preTitle?: string;
    title: string;
    description?: string;
}

export default function LandingSectionHeader({ preTitle, title, description }: SectionHeaderProps) {

    const fadeInUp = {
        initial: { opacity: 0, y: 60 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6, ease: "easeOut" }
    };

    return (
        <motion.div
            className="text-center flex flex-col items-center gap-8"
            initial="initial"
            variants={fadeInUp}
            viewport={{ once: true }}
            whileInView="animate"
        >
            <span className="text-primary font-semibold text-sm tracking-wide uppercase">
                {preTitle}
            </span>
            <h2 className="text-5xl font-bold text-gray-900">
                {title}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl text-center">
                {description}
            </p>
        </motion.div>
    )

}