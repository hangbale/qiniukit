module.exports = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>文件列表</title>
  <style>
    * {
      box-sizing: border-box;
    }
    .wrapper {
      padding: 20px;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
    }
    .item {
      width: 20%;
      position: relative;
    }
    .item:hover .action {
      display: flex;
    }
    .item:nth-child(n+3) {
      padding-top: 20px;
    }
    .image {
      width: 100%;
      margin: 0;
      display: block;
    }
    .image:hover {
      box-shadow: 0 0 3px 3px #333;
    }
    .pagination {
      margin: 40px auto;
      border-radius: 24px;
      font-size: 14px;
      color: #fff;
      height: 48px;
      line-height: 48px;
      background-color: dodgerblue;
      text-align: center;
      width: 200px;
      cursor: pointer;
    }
    .action {
      background: #fff;
      /* display: flex; */
      padding: 10px 0;
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      background: rgba(40, 53, 76, 0.5);
      display: none;
      
    }
    .action-item {
      width: 50%;
      text-align: center;
      color: #fff;
      font-size: 14px;
      cursor: pointer;
      margin: auto 0;
    }
  </style>
</head>
<body>
  <div class="wrapper" id="list">
  </div>
  <div class="pagination" id="pagination">下一页</div>
  <script>
    const vscode = acquireVsCodeApi();
    window.addEventListener('message', function (evt) {
      
      if (evt && evt.data) {
        addListItem(evt.data)
      }
    })
    function addListItem (data) {
      let dataList = data.list
      console.log(data)
      let list = document.getElementById('list')
      let node = document.createDocumentFragment()
      dataList.forEach(element => {
        let item = document.createElement('div')
        item.setAttribute('class', 'item')
        item.setAttribute('data-item', JSON.stringify(element))
        item.onclick = function (eve) {
          
          if (eve.srcElement.id) {
            vscode.postMessage({
              action: eve.srcElement.id,
              data: element
            })
          }
        }
        let img = document.createElement('img')
        img.src = element.url
        item.appendChild(img)
        let action = document.createElement('div')
        action.setAttribute('class', 'action')
        action.innerHTML = '<div id="remove" class="action-item">删除</div><div id="copy" class="action-item">复制链接</div>';
        item.appendChild(action)
        node.appendChild(item)
      });
      list.appendChild(node)
    }
    document.getElementById('pagination').addEventListener('click', function () {
      vscode.postMessage({
        action: 'next'
      })
    })
  </script>
</body>
</html>`