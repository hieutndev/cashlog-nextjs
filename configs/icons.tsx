import { RxDashboard } from "react-icons/rx";
import { RiArrowLeftRightFill } from "react-icons/ri";
import { PiTarget } from "react-icons/pi";
import { FiSearch, FiSettings } from "react-icons/fi";
import { GrFormNextLink, GrFormPreviousLink } from "react-icons/gr";
import { LuCalendarArrowDown, LuCalendarArrowUp, LuCircleAlert, LuCircleCheck, LuFileUp, LuPlay, LuRefreshCcw, LuLayers } from "react-icons/lu";
import { IoAnalyticsSharp, IoLogOutOutline } from "react-icons/io5";
import {
	FaArrowDownWideShort,
	FaArrowRotateLeft,
	FaArrowTrendDown,
	FaArrowTrendUp,
	FaArrowUpWideShort,
	FaBars,
	FaBarsProgress,
	FaCreditCard,
	FaEllipsis,
	FaGripLines,
	FaListUl,
	FaPencil,
	FaPlus,
	FaTableList,
	FaTrash,
	FaUser,
	FaXmark,
} from "react-icons/fa6";
import { FaDollarSign } from "react-icons/fa";
import { LuGitPullRequestArrow } from "react-icons/lu";
const SIZE_ICON = {
	SM: 14,
	MD: 16,
	LG: 20,
	XL: 24,
};

const ICONS = {
	OVERVIEW: {
		SM: <RxDashboard size={SIZE_ICON.SM} />,
		MD: <RxDashboard size={SIZE_ICON.MD} />,
		LG: <RxDashboard size={SIZE_ICON.LG} />,
		XL: <RxDashboard size={SIZE_ICON.XL} />,
	},
	TRANSACTIONS: {
		SM: <RiArrowLeftRightFill size={SIZE_ICON.SM} />,
		MD: <RiArrowLeftRightFill size={SIZE_ICON.MD} />,
		LG: <RiArrowLeftRightFill size={SIZE_ICON.LG} />,
		XL: <RiArrowLeftRightFill size={SIZE_ICON.XL} />,
	},
	PLAN: {
		SM: <PiTarget size={SIZE_ICON.SM} />,
		MD: <PiTarget size={SIZE_ICON.MD} />,
		LG: <PiTarget size={SIZE_ICON.LG} />,
		XL: <PiTarget size={SIZE_ICON.XL} />,
	},
	SETTING: {
		SM: <FiSettings size={SIZE_ICON.SM} />,
		MD: <FiSettings size={SIZE_ICON.MD} />,
		LG: <FiSettings size={SIZE_ICON.LG} />,
		XL: <FiSettings size={SIZE_ICON.XL} />,
	},
	BACK: {
		SM: <GrFormPreviousLink size={SIZE_ICON.SM} />,
		MD: <GrFormPreviousLink size={SIZE_ICON.MD} />,
		LG: <GrFormPreviousLink size={SIZE_ICON.LG} />,
		XL: <GrFormPreviousLink size={SIZE_ICON.XL} />,
	},
	NEXT: {
		SM: <GrFormNextLink size={SIZE_ICON.SM} />,
		MD: <GrFormNextLink size={SIZE_ICON.MD} />,
		LG: <GrFormNextLink size={SIZE_ICON.LG} />,
		XL: <GrFormNextLink size={SIZE_ICON.XL} />,
	},
	NEW: {
		SM: <FaPlus size={SIZE_ICON.SM} />,
		MD: <FaPlus size={SIZE_ICON.MD} />,
		LG: <FaPlus size={SIZE_ICON.LG} />,
		XL: <FaPlus size={SIZE_ICON.XL} />,
	},
	CARD: {
		SM: <FaCreditCard size={SIZE_ICON.SM} />,
		MD: <FaCreditCard size={SIZE_ICON.MD} />,
		LG: <FaCreditCard size={SIZE_ICON.LG} />,
		XL: <FaCreditCard size={SIZE_ICON.XL} />,
	},
	TABLE: {
		SM: <FaTableList size={SIZE_ICON.SM} />,
		MD: <FaTableList size={SIZE_ICON.MD} />,
		LG: <FaTableList size={SIZE_ICON.LG} />,
		XL: <FaTableList size={SIZE_ICON.XL} />,
	},
	USER: {
		SM: <FaUser size={SIZE_ICON.SM} />,
		MD: <FaUser size={SIZE_ICON.MD} />,
		LG: <FaUser size={SIZE_ICON.LG} />,
		XL: <FaUser size={SIZE_ICON.XL} />,
	},
	CATEGORY: {
		SM: <FaBarsProgress size={SIZE_ICON.SM} />,
		MD: <FaBarsProgress size={SIZE_ICON.MD} />,
		LG: <FaBarsProgress size={SIZE_ICON.LG} />,
		XL: <FaBarsProgress size={SIZE_ICON.XL} />,
	},
	RESET: {
		SM: <FaArrowRotateLeft size={SIZE_ICON.SM} />,
		MD: <FaArrowRotateLeft size={SIZE_ICON.MD} />,
		LG: <FaArrowRotateLeft size={SIZE_ICON.LG} />,
		XL: <FaArrowRotateLeft size={SIZE_ICON.XL} />,
	},
	SORT_UP: {
		SM: <FaArrowUpWideShort size={SIZE_ICON.SM} />,
		MD: <FaArrowUpWideShort size={SIZE_ICON.MD} />,
		LG: <FaArrowUpWideShort size={SIZE_ICON.LG} />,
		XL: <FaArrowUpWideShort size={SIZE_ICON.XL} />,
	},
	SORT_DOWN: {
		SM: <FaArrowDownWideShort size={SIZE_ICON.SM} />,
		MD: <FaArrowDownWideShort size={SIZE_ICON.MD} />,
		LG: <FaArrowDownWideShort size={SIZE_ICON.LG} />,
		XL: <FaArrowDownWideShort size={SIZE_ICON.XL} />,
	},

	DATE_ASC: {
		SM: <LuCalendarArrowUp size={SIZE_ICON.SM} />,
		MD: <LuCalendarArrowUp size={SIZE_ICON.MD} />,
		LG: <LuCalendarArrowUp size={SIZE_ICON.LG} />,
		XL: <LuCalendarArrowUp size={SIZE_ICON.XL} />,
	},
	DATE_DESC: {
		SM: <LuCalendarArrowDown size={SIZE_ICON.SM} />,
		MD: <LuCalendarArrowDown size={SIZE_ICON.MD} />,
		LG: <LuCalendarArrowDown size={SIZE_ICON.LG} />,
		XL: <LuCalendarArrowDown size={SIZE_ICON.XL} />,
	},
	SEARCH: {
		SM: <FiSearch size={SIZE_ICON.SM} />,
		MD: <FiSearch size={SIZE_ICON.MD} />,
		LG: <FiSearch size={SIZE_ICON.LG} />,
		XL: <FiSearch size={SIZE_ICON.XL} />,
	},
	FORECAST: {
		SM: <IoAnalyticsSharp size={SIZE_ICON.SM} />,
		MD: <IoAnalyticsSharp size={SIZE_ICON.MD} />,
		LG: <IoAnalyticsSharp size={SIZE_ICON.LG} />,
		XL: <IoAnalyticsSharp size={SIZE_ICON.XL} />,
	},
	DOLLAR: {
		SM: <FaDollarSign size={SIZE_ICON.SM} />,
		MD: <FaDollarSign size={SIZE_ICON.MD} />,
		LG: <FaDollarSign size={SIZE_ICON.LG} />,
		XL: <FaDollarSign size={SIZE_ICON.XL} />,
	},
	EDIT: {
		SM: <FaPencil size={SIZE_ICON.SM} />,
		MD: <FaPencil size={SIZE_ICON.MD} />,
		LG: <FaPencil size={SIZE_ICON.LG} />,
		XL: <FaPencil size={SIZE_ICON.XL} />,
	},
	TRASH: {
		SM: <FaTrash size={SIZE_ICON.SM} />,
		MD: <FaTrash size={SIZE_ICON.MD} />,
		LG: <FaTrash size={SIZE_ICON.LG} />,
		XL: <FaTrash size={SIZE_ICON.XL} />,
	},
	DETAILS: {
		SM: <FaListUl size={SIZE_ICON.SM} />,
		MD: <FaListUl size={SIZE_ICON.MD} />,
		LG: <FaListUl size={SIZE_ICON.LG} />,
		XL: <FaListUl size={SIZE_ICON.XL} />,
	},
	XMARK: {
		SM: <FaXmark size={SIZE_ICON.SM} />,
		MD: <FaXmark size={SIZE_ICON.MD} />,
		LG: <FaXmark size={SIZE_ICON.LG} />,
		XL: <FaXmark size={SIZE_ICON.XL} />,
	},
	INCOME: {
		SM: <FaArrowTrendUp size={SIZE_ICON.SM} />,
		MD: <FaArrowTrendUp size={SIZE_ICON.MD} />,
		LG: <FaArrowTrendUp size={SIZE_ICON.LG} />,
		XL: <FaArrowTrendUp size={SIZE_ICON.XL} />,
	},
	EXPENSE: {
		SM: <FaArrowTrendDown size={SIZE_ICON.SM} />,
		MD: <FaArrowTrendDown size={SIZE_ICON.MD} />,
		LG: <FaArrowTrendDown size={SIZE_ICON.LG} />,
		XL: <FaArrowTrendDown size={SIZE_ICON.XL} />,
	},
	NEUTRAL: {
		SM: <FaGripLines size={SIZE_ICON.SM} />,
		MD: <FaGripLines size={SIZE_ICON.MD} />,
		LG: <FaGripLines size={SIZE_ICON.LG} />,
		XL: <FaGripLines size={SIZE_ICON.XL} />,
	},
	ELLIPSIS: {
		SM: <FaEllipsis size={SIZE_ICON.SM} />,
		MD: <FaEllipsis size={SIZE_ICON.MD} />,
		LG: <FaEllipsis size={SIZE_ICON.LG} />,
		XL: <FaEllipsis size={SIZE_ICON.XL} />,
	},
	LOGOUT: {
		SM: <IoLogOutOutline size={SIZE_ICON.SM} />,
		MD: <IoLogOutOutline size={SIZE_ICON.MD} />,
		LG: <IoLogOutOutline size={SIZE_ICON.LG} />,
		XL: <IoLogOutOutline size={SIZE_ICON.XL} />,
	},
	BARS: {
		SM: <FaBars size={SIZE_ICON.SM} />,
		MD: <FaBars size={SIZE_ICON.MD} />,
		LG: <FaBars size={SIZE_ICON.LG} />,
		XL: <FaBars size={SIZE_ICON.XL} />,
	},
	IMPORT: {
		SM: <LuFileUp size={SIZE_ICON.SM} />,
		MD: <LuFileUp size={SIZE_ICON.MD} />,
		LG: <LuFileUp size={SIZE_ICON.LG} />,
		XL: <LuFileUp size={SIZE_ICON.XL} />,
	},
	ALERT_CIRCLE: {
		SM: <LuCircleAlert size={SIZE_ICON.SM} />,
		MD: <LuCircleAlert size={SIZE_ICON.MD} />,
		LG: <LuCircleAlert size={SIZE_ICON.LG} />,
		XL: <LuCircleAlert size={SIZE_ICON.XL} />,
	},
	CHECK_CIRCLE: {
		SM: <LuCircleCheck size={SIZE_ICON.SM} />,
		MD: <LuCircleCheck size={SIZE_ICON.MD} />,
		LG: <LuCircleCheck size={SIZE_ICON.LG} />,
		XL: <LuCircleCheck size={SIZE_ICON.XL} />,
	},
	PLAY: {
		SM: <LuPlay size={SIZE_ICON.SM} />,
		MD: <LuPlay size={SIZE_ICON.MD} />,
		LG: <LuPlay size={SIZE_ICON.LG} />,
		XL: <LuPlay size={SIZE_ICON.XL} />,
	},
	GIT_PULL_REQUEST: {
		SM: <LuGitPullRequestArrow size={SIZE_ICON.SM} />,
		MD: <LuGitPullRequestArrow size={SIZE_ICON.MD} />,
		LG: <LuGitPullRequestArrow size={SIZE_ICON.LG} />,
		XL: <LuGitPullRequestArrow size={SIZE_ICON.XL} />,
	},
	SYNC: {
		SM: <LuRefreshCcw size={SIZE_ICON.SM} />,
		MD: <LuRefreshCcw size={SIZE_ICON.MD} />,
		LG: <LuRefreshCcw size={SIZE_ICON.LG} />,
		XL: <LuRefreshCcw size={SIZE_ICON.XL} />,
	},
	BULK: {
		SM: <LuLayers size={SIZE_ICON.SM} />,
		MD: <LuLayers size={SIZE_ICON.MD} />,
		LG: <LuLayers size={SIZE_ICON.LG} />,
		XL: <LuLayers size={SIZE_ICON.XL} />,
	}
};

export default ICONS;
