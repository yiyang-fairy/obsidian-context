import * as _ from "lodash";
import { App, PluginSettingTab, Setting } from "obsidian";
import { getAllNoteFolders } from "src/buildView/setting";
import Context from "src/main";

export class ContextSettingTab extends PluginSettingTab {
	plugin: Context;

	constructor(app: App, plugin: Context) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl).setName("Context Setting");

		new Setting(containerEl)
			.setName("选择筛选文件方式")
			.setDesc("以glob模式路径匹配")
			.addToggle((value) => {
				value
					.setValue(this.plugin.settings.filterType)
					.onChange(async (newValue) => {
						this.plugin.settings.filterType = newValue;

						await this.plugin.saveSettings();
						this.display();
					});
			});

		if (this.plugin.settings.filterType) {
			new Setting(this.containerEl)
				.setName("手动添加文件夹")
				.setDesc("以glob模式匹配")
				.addText((text) => {
					text.setPlaceholder("输入文件夹名称")
						.setValue(this.plugin.settings.inputtedFolder)
						.onChange(async (value) => {
							this.debouncedHandleValueChanged(value);
						});
				});
		} else {
			new Setting(this.containerEl)
				.setName("选择文件夹")
				.setDesc("选择你想查找的文件夹")
				.addDropdown(async (dropdown) => {
					const folders = getAllNoteFolders(); // 获取所有文件夹的列表
					dropdown
						.addOptions(folders) // 将文件夹列表添加为下拉框的选项
						.setValue(this.plugin.settings.selectedFolder) // 设置下拉框的初始值为已保存的设置值
						.onChange(async (value) => {
							this.plugin.settings.selectedFolder = value; // 将选择的文件夹保存到设置中
							await this.plugin.saveSettings();
						});
				});
		}

		// new Setting(containerEl)
		// 	.setName("自定义分隔符")
		// 	.setDesc(
		// 		"对于需要需要聚合的标题的内容提前终止截取（以输入分隔符开头即匹配）"
		// 	)
		// 	.addText((text) => {
		// 		text.setPlaceholder("输入分隔符")
		// 			.setValue(this.plugin.settings.delimiter)
		// 			.onChange(async (value) => {
		// 				this.plugin.settings.delimiter = value.trim(); // 将选择的文件夹保存到设置中
		// 				await this.plugin.saveSettings();
		// 			});
		// 	});
	}

	handleValueChanged = async (value: string) => {
		this.plugin.settings.inputtedFolder = value;
		await this.plugin.saveSettings();
	};

	debouncedHandleValueChanged = _.debounce(this.handleValueChanged, 500);
}
