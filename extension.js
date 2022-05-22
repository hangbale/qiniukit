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
				let filename = file.path.match(/[^\.\/]+\.[a-zA-Z0-9]+$/);
				if (!filename) {
					vscode.window.showErrorMessage('选择文件失败');
					return;
				}
				filename = filename[0];
				console.log('outer')
				console.log(filename)
				qiniuKit.upload(file.path, filename);
			}
		})
	});

	let listDis = vscode.commands.registerCommand('extension.qnlist', function () {

		const panel = vscode.window.createWebviewPanel(
			'空间文件管理',
			'空间文件管理',
			vscode.ViewColumn.One,
			{
				enableScripts: true
			}
		);
		let page = null;

		panel.webview.onDidReceiveMessage(function (evt) {
			if (evt.action === 'next') {
				console.log('show next');
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
		
		fetchList()
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