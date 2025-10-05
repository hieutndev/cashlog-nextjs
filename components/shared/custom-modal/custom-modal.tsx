import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/modal";
import { useWindowSize } from "hieutndev-toolkit";

import { BREAK_POINT } from "@/configs/break-point";

interface CustomModalProps {
    title: string;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
}

export default function CustomModal({ title, isOpen, onOpenChange, children }: CustomModalProps) {

    const { width } = useWindowSize();

    return (<Modal
        hideCloseButton={width >= BREAK_POINT.MD ? true : false}
        isOpen={isOpen}
        placement="top"
        scrollBehavior="inside"
        size={width >= BREAK_POINT.MD ? "2xl" : "full"}
        onOpenChange={onOpenChange}
    >
        <ModalContent>
            <ModalHeader>
                <h3 className="text-xl">{title}</h3>
            </ModalHeader>
            <ModalBody className="mb-4">
                {children}
            </ModalBody>
        </ModalContent>
    </Modal>);
}