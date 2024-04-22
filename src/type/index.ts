export interface ContextSettings {
	selectedFolder: string;
	inputtedFolder: string;
	filterType: boolean; // true 为 glob 模式匹配； false 为文件夹匹配
}

export interface FileTitle {
	title?: string;
	subHeading: string;
	content: string;
}
