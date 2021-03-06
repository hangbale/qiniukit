// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const qiniuKit = require('./lib/qiniu');
const view = require('./lib/view');


/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {


	let disposable = vscode.commands.registerCommand('extension.qnupload', function () {
		

		vscode.window.showOpenDialog({
			canSelectMany: false,
			openLabel: 'Open'
		}).then(fileUri => {
			if (fileUri && fileUri[0]) {
				let file = fileUri[0];
				qiniuKit.upload(file.path);
			}
		})
	});

	let listDis = vscode.commands.registerCommand('extension.qnlist', function () {

		const panel = vscode.window.createWebviewPanel(
			'空间文件管理',
			'空间文件管理',
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true
			}
		);
		let page = null;

		panel.webview.onDidReceiveMessage(function (evt) {
			if (evt.action === 'next') {
				fetchList()
			}
			if (evt.action === 'remove') {
				qiniuKit.remove(evt.data.key)
			}
			if (evt.action === 'copy') {
				vscode.env.clipboard.writeText(evt.data.url).then(() => {
					vscode.window.showInformationMessage('外链已复制到粘贴板');
				})
			}
		})
		panel.webview.html = view.getHtml()

		function fetchList() {
			qiniuKit.list({
				marker: page
			}, function (data) {
				page = data.marker
				panel.webview.postMessage(data);
			})
		}
		
	})
	context.subscriptions.push(disposable);
	context.subscriptions.push(listDis);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}