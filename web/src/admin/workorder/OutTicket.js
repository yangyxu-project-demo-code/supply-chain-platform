var React = require('react');
module.exports = React.createClass({
	getDefaultProps: function () {
		return {
			indexId: 9
		};
	},
	getInitialState: function () {
		return {
			state: 1,
			data: zn.store.post('/zn.plugin.workflow/wfinstance/getInstances', {
				index_id: this.props.indexId,
				state: 1
			}),
			items: [
				{ title: '单号', name: 'code', width: 150, filter: { type: 'Input', opts: ['like'] } },
				{ title: '状态', name: 'state', width: 80 },
				{ title: '当前节点', name: 'current_state', width: 120 },
				{ title: '申请人', name: 'zn_create_user_convert', width: 100 },
				{ title: '申请时间', name: 'zn_create_time', width: 140, filter: { type: 'Input', opts: ['like'] } },
				{ title: '最近一次操作时间', name: 'zn_modify_time', width: 140, filter: { type: 'Input', opts: ['like'] } },
				{ title: '说明', name: 'zn_note' }
			],
			toolbarItems: [
				{ text: '开单出库', name: 'add', icon: 'fa-plus' }
			]
		}
	},
	__onCreateSuccess: function (instanceId){
		zn.react.session.relativeJump('/znpluginworkflow.wfinstance?instanceId='+instanceId);
	},
	__createInstance: function (index){
		zn.react.session.relativeJump('/znpluginworkflow.wfcreateinstance?indexId=' + this.props.indexId);
		return false;
		zn.dialog({
			title: '开单出库',
			content: <zn.plugin.workflow.CreateInstance id={this.props.indexId} onCreateSuccess={this.__onCreateSuccess} />
		});
	},
	__onToolbarClick: function (item){
		switch (item.name) {
			case 'add':
				this.__createInstance();
				break;
		}
	},
	__onTableColumnRender: function (rowIndex, columnIndex, data, item, value){
		switch (columnIndex) {
			case 0:
				return <a data-tooltip={data.closed?'已关闭':''} style={{color:(data.closed?'#919191':null)}} href={'#'+zn.react.session.fixPath('/znpluginworkflow.wfinstance')+'?instanceId=' + data.id}>{value}</a>;
			case 1:
				switch (value) {
					case 1:
						return <div>
							<span className="status" style={{backgroundColor: '#f0ad4e'}}>待处理</span>
						</div>;
					case -1:
						return <div>
							<span className="status" style={{backgroundColor: '#6def55'}}>已结束</span>
							{
								/*
								<a href={'#'+zn.react.session.fixPath('/workorder.sale.ticket.detail.sum')+'?wf_id=' + data.id}><i data-tooltip="查看汇总表" className="fa fa-pie-chart btn" /></a>
								<a href={'#'+zn.react.session.fixPath('/workorder.sale.ticket.detail.list')+'?wf_id=' + data.id}><i data-tooltip="查看商品列表" className="fa fa-list-ul btn" /></a>
								*/
							}
						</div>;
					case -2:
						return <span className="status" style={{backgroundColor: '#dad8d8'}}>已取消</span>;
					case 2:
						return <span className="status" style={{backgroundColor: '#0d8c06'}}>已审核</span>;
				}
				break;
		}
	},
	__onStatusChange: function (data){
		this.state.data._data.state = data.value;
		this.state.data.exec();
		this.setState({ state: data.value });
	},
	render:function(){
		return (
			<zn.react.Page title='开单出库' className="zn-plugin-workflow-wf-my"
				headerCenter={<zn.react.ListView
					className="zr-tab-ios"
					selectMode="radio"
					valueKey="state"
					onClick={this.__onStatusChange}
					value={this.state.state}
					data={[
						{ state: 1, text: '待处理' },
						{ state: -1, text: '已结束' },
						{ state: 2, text: '已审核' },
						{ state: -2, text: '已取消' }
					]} />}
				toolbarItems={this.state.toolbarItems}
				onToolbarClick={this.__onToolbarClick} >
				<zn.react.PagerView
					view="Table"
					enableFilter={true}
					checkbox={0}
					showHeader={true}
					data={this.state.data}
					columnRender={this.__onTableColumnRender}
					items={this.state.items}/>
			</zn.react.Page>
		);
	}
});
