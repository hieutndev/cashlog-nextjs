import { Modal, ModalContent, ModalHeader, ModalBody, ModalProps, ModalFooter } from "@heroui/modal";
import { useWindowSize } from "hieutndev-toolkit";

import { BREAK_POINT } from "@/configs/break-point";

interface CustomModalProps {
    title: string;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
    size?: ModalProps["size"];
    customFooter?: React.ReactNode;
}

export default function CustomModal({ title, isOpen, onOpenChange, children, size, customFooter }: CustomModalProps) {

    const { width } = useWindowSize();

    return (<Modal
        hideCloseButton={size === "full" ? false : width >= BREAK_POINT.MD ? true : false}
        isOpen={isOpen}
        placement="top"
        scrollBehavior="inside"
        size={width >= BREAK_POINT.MD ? size ?? "2xl" : "full"}
        onOpenChange={onOpenChange}
    >
        <ModalContent>
            <ModalHeader>
                <h3 className="text-xl">{title}</h3>
            </ModalHeader>
            <ModalBody className="mb-4">
                {children}
            </ModalBody>
            {customFooter && <ModalFooter>
                {customFooter}
            </ModalFooter>}
        </ModalContent>
    </Modal>);
}