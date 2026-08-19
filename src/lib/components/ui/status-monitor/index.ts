import Bar from "./status-monitor-bar.svelte";
import Combined from "./status-monitor-combined.svelte";
import Header from "./status-monitor-header.svelte";
import Legend from "./status-monitor-legend.svelte";
import Root from "./status-monitor.svelte";
import Track from "./status-monitor-track.svelte";

export { type StatusMonitorProps, type StatusMonitorRootProps } from "./status-monitor.svelte";
export { type StatusMonitorBarProps } from "./status-monitor-bar.svelte";
export { type StatusMonitorCombinedProps } from "./status-monitor-combined.svelte";
export { type StatusMonitorHeaderProps } from "./status-monitor-header.svelte";
export { type StatusMonitorLegendProps } from "./status-monitor-legend.svelte";
export { type StatusMonitorTrackProps } from "./status-monitor-track.svelte";

export {
	computeStatusMonitorUptime,
	formatStatusMonitorTimestamp,
	getStatusMonitorContext,
	getStatusMonitorTrackWidth,
	hasStatusMonitorContext,
	normaliseStatusMonitorPeriods,
	observeStatusMonitorWidth,
	padStatusMonitorPeriods,
	resolveStatusMonitorSlots,
	resolveStatusMonitorStatus,
	resolveStatusMonitorUnit,
	setStatusMonitorContext,
	statusMonitorBarVariants,
	StatusMonitorState,
	STATUS_MONITOR_BAR_GAP,
	STATUS_MONITOR_BAR_WIDTH,
	STATUS_MONITOR_EMPTY_PERIOD,
	STATUS_MONITOR_INFO,
	STATUS_MONITOR_LABELS,
	STATUS_MONITOR_MAX_SLOTS,
	STATUS_MONITOR_MIN_SLOTS,
	STATUS_MONITOR_SLOT_COUNTS,
	STATUS_MONITOR_STATUSES,
	STATUS_MONITOR_STATUS_VARIANTS,
	STATUS_MONITOR_UNITS,
	type StatusMonitorPeriod,
	type StatusMonitorStateProps,
	type StatusMonitorStatus,
	type StatusMonitorUnit,
} from "./status-monitor.svelte.js";

export {
	Root,
	Header,
	Track,
	Bar,
	Legend,
	Combined,
	//
	Root as StatusMonitor,
	Header as StatusMonitorHeader,
	Track as StatusMonitorTrack,
	Bar as StatusMonitorBar,
	Legend as StatusMonitorLegend,
	Combined as StatusMonitorCombined,
};
