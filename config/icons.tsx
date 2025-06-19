import { RxDashboard } from "react-icons/rx";
import { RiArrowLeftRightFill } from "react-icons/ri";
import { PiTarget } from "react-icons/pi";
import { FiSearch, FiSettings } from "react-icons/fi";
import { GrFormNextLink, GrFormPreviousLink } from "react-icons/gr";
import { LuCalendarArrowDown, LuCalendarArrowUp } from "react-icons/lu";
import { IoAnalyticsSharp, IoLogOutOutline } from "react-icons/io5";
import {
	FaArrowDownWideShort,
	FaArrowRotateLeft,
	FaArrowTrendDown,
	FaArrowTrendUp,
	FaArrowUpWideShort,
	FaBarsProgress,
	FaCreditCard,
	FaEllipsis,
	FaListUl,
	FaPencil,
	FaPlus,
	FaTableList,
	FaTrash,
	FaUser,
	FaXmark,
} from "react-icons/fa6";
import { FaDollarSign } from "react-icons/fa";
const SIZE_ICON = {
	sm: 14,
	md: 16,
	lg: 20,
	xl: 24,
};

const SYS_ICONS = {
	OVERVIEW: {
		SM: <RxDashboard size={SIZE_ICON.sm} />,
		MD: <RxDashboard size={SIZE_ICON.md} />,
		LG: <RxDashboard size={SIZE_ICON.lg} />,
		XL: <RxDashboard size={SIZE_ICON.xl} />,
	},
	TRANSACTIONS: {
		SM: <RiArrowLeftRightFill size={SIZE_ICON.sm} />,
		MD: <RiArrowLeftRightFill size={SIZE_ICON.md} />,
		LG: <RiArrowLeftRightFill size={SIZE_ICON.lg} />,
		XL: <RiArrowLeftRightFill size={SIZE_ICON.xl} />,
	},
	PLAN: {
		SM: <PiTarget size={SIZE_ICON.sm} />,
		MD: <PiTarget size={SIZE_ICON.md} />,
		LG: <PiTarget size={SIZE_ICON.lg} />,
		XL: <PiTarget size={SIZE_ICON.xl} />,
	},
	SETTING: {
		SM: <FiSettings size={SIZE_ICON.sm} />,
		MD: <FiSettings size={SIZE_ICON.md} />,
		LG: <FiSettings size={SIZE_ICON.lg} />,
		XL: <FiSettings size={SIZE_ICON.xl} />,
	},
	BACK: {
		SM: <GrFormPreviousLink size={SIZE_ICON.sm} />,
		MD: <GrFormPreviousLink size={SIZE_ICON.md} />,
		LG: <GrFormPreviousLink size={SIZE_ICON.lg} />,
		XL: <GrFormPreviousLink size={SIZE_ICON.xl} />,
	},
	NEXT: {
		SM: <GrFormNextLink size={SIZE_ICON.sm} />,
		MD: <GrFormNextLink size={SIZE_ICON.md} />,
		LG: <GrFormNextLink size={SIZE_ICON.lg} />,
		XL: <GrFormNextLink size={SIZE_ICON.xl} />,
	},
	NEW: {
		SM: <FaPlus size={SIZE_ICON.sm} />,
		MD: <FaPlus size={SIZE_ICON.md} />,
		LG: <FaPlus size={SIZE_ICON.lg} />,
		XL: <FaPlus size={SIZE_ICON.xl} />,
	},
	CARD: {
		SM: <FaCreditCard size={SIZE_ICON.sm} />,
		MD: <FaCreditCard size={SIZE_ICON.md} />,
		LG: <FaCreditCard size={SIZE_ICON.lg} />,
		XL: <FaCreditCard size={SIZE_ICON.xl} />,
	},
	TABLE: {
		SM: <FaTableList size={SIZE_ICON.sm} />,
		MD: <FaTableList size={SIZE_ICON.md} />,
		LG: <FaTableList size={SIZE_ICON.lg} />,
		XL: <FaTableList size={SIZE_ICON.xl} />,
	},
	USER: {
		SM: <FaUser size={SIZE_ICON.sm} />,
		MD: <FaUser size={SIZE_ICON.md} />,
		LG: <FaUser size={SIZE_ICON.lg} />,
		XL: <FaUser size={SIZE_ICON.xl} />,
	},
	CATEGORY: {
		SM: <FaBarsProgress size={SIZE_ICON.sm} />,
		MD: <FaBarsProgress size={SIZE_ICON.md} />,
		LG: <FaBarsProgress size={SIZE_ICON.lg} />,
		XL: <FaBarsProgress size={SIZE_ICON.xl} />,
	},
	RESET: {
		SM: <FaArrowRotateLeft size={SIZE_ICON.sm} />,
		MD: <FaArrowRotateLeft size={SIZE_ICON.md} />,
		LG: <FaArrowRotateLeft size={SIZE_ICON.lg} />,
		XL: <FaArrowRotateLeft size={SIZE_ICON.xl} />,
	},
	SORT_UP: {
		SM: <FaArrowUpWideShort size={SIZE_ICON.sm} />,
		MD: <FaArrowUpWideShort size={SIZE_ICON.md} />,
		LG: <FaArrowUpWideShort size={SIZE_ICON.lg} />,
		XL: <FaArrowUpWideShort size={SIZE_ICON.xl} />,
	},
	SORT_DOWN: {
		SM: <FaArrowDownWideShort size={SIZE_ICON.sm} />,
		MD: <FaArrowDownWideShort size={SIZE_ICON.md} />,
		LG: <FaArrowDownWideShort size={SIZE_ICON.lg} />,
		XL: <FaArrowDownWideShort size={SIZE_ICON.xl} />,
	},

	DATE_ASC: {
		SM: <LuCalendarArrowUp size={SIZE_ICON.sm} />,
		MD: <LuCalendarArrowUp size={SIZE_ICON.md} />,
		LG: <LuCalendarArrowUp size={SIZE_ICON.lg} />,
		XL: <LuCalendarArrowUp size={SIZE_ICON.xl} />,
	},
	DATE_DESC: {
		SM: <LuCalendarArrowDown size={SIZE_ICON.sm} />,
		MD: <LuCalendarArrowDown size={SIZE_ICON.md} />,
		LG: <LuCalendarArrowDown size={SIZE_ICON.lg} />,
		XL: <LuCalendarArrowDown size={SIZE_ICON.xl} />,
	},
	SEARCH: {
		SM: <FiSearch size={SIZE_ICON.sm} />,
		MD: <FiSearch size={SIZE_ICON.md} />,
		LG: <FiSearch size={SIZE_ICON.lg} />,
		XL: <FiSearch size={SIZE_ICON.xl} />,
	},
	FORECAST: {
		SM: <IoAnalyticsSharp size={SIZE_ICON.sm} />,
		MD: <IoAnalyticsSharp size={SIZE_ICON.md} />,
		LG: <IoAnalyticsSharp size={SIZE_ICON.lg} />,
		XL: <IoAnalyticsSharp size={SIZE_ICON.xl} />,
	},
	DOLLAR: {
		SM: <FaDollarSign size={SIZE_ICON.sm} />,
		MD: <FaDollarSign size={SIZE_ICON.md} />,
		LG: <FaDollarSign size={SIZE_ICON.lg} />,
		XL: <FaDollarSign size={SIZE_ICON.xl} />,
	},
	EDIT: {
		SM: <FaPencil size={SIZE_ICON.sm} />,
		MD: <FaPencil size={SIZE_ICON.md} />,
		LG: <FaPencil size={SIZE_ICON.lg} />,
		XL: <FaPencil size={SIZE_ICON.xl} />,
	},
	TRASH: {
		SM: <FaTrash size={SIZE_ICON.sm} />,
		MD: <FaTrash size={SIZE_ICON.md} />,
		LG: <FaTrash size={SIZE_ICON.lg} />,
		XL: <FaTrash size={SIZE_ICON.xl} />,
	},
	DETAILS: {
		SM: <FaListUl size={SIZE_ICON.sm} />,
		MD: <FaListUl size={SIZE_ICON.md} />,
		LG: <FaListUl size={SIZE_ICON.lg} />,
		XL: <FaListUl size={SIZE_ICON.xl} />,
	},
	XMARK: {
		SM: <FaXmark size={SIZE_ICON.sm} />,
		MD: <FaXmark size={SIZE_ICON.md} />,
		LG: <FaXmark size={SIZE_ICON.lg} />,
		XL: <FaXmark size={SIZE_ICON.xl} />,
	},
	INCOME: {
		SM: <FaArrowTrendUp size={SIZE_ICON.sm} />,
		MD: <FaArrowTrendUp size={SIZE_ICON.md} />,
		LG: <FaArrowTrendUp size={SIZE_ICON.lg} />,
		XL: <FaArrowTrendUp size={SIZE_ICON.xl} />,
	},
	EXPENSE: {
		SM: <FaArrowTrendDown size={SIZE_ICON.sm} />,
		MD: <FaArrowTrendDown size={SIZE_ICON.md} />,
		LG: <FaArrowTrendDown size={SIZE_ICON.lg} />,
		XL: <FaArrowTrendDown size={SIZE_ICON.xl} />,
	},
	ELLIPSIS: {
		SM: <FaEllipsis size={SIZE_ICON.sm} />,
		MD: <FaEllipsis size={SIZE_ICON.md} />,
		LG: <FaEllipsis size={SIZE_ICON.lg} />,
		XL: <FaEllipsis size={SIZE_ICON.xl} />,
	},
	LOGOUT: {
		SM: <IoLogOutOutline size={SIZE_ICON.sm} />,
		MD: <IoLogOutOutline size={SIZE_ICON.md} />,
		LG: <IoLogOutOutline size={SIZE_ICON.lg} />,
		XL: <IoLogOutOutline size={SIZE_ICON.xl} />,
	},
};

export default SYS_ICONS;
