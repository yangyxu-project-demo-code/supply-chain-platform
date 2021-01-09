var React = require('react');
var SupplierInfo = require('./SupplierInfo.js');
var SupplierBackTicket = require('./SupplierBackTicket.js');
var SupplierSaleServices = require('./SupplierSaleServices.js');
var SupplierQuote = require('./SupplierProductQuote.js');
var SupplierOrderDetails = require('./SupplierOrderDetails.js');
var SupplierOrderWFInstance = require('./SupplierOrderWFInstance.js');

module.exports = React.createClass({
	getInitialState: function() {
    	return {
			view: SupplierInfo,
			info: null,
			toolbarItems: [
				//{ text: '编辑', name: 'edit', icon: 'fa-edit', status: 'danger' }
			]
		};
  	},
	componentDidMount: function (){
		this.__loadInfo(this.props.request.search.znid);
	},
	componentWillReceiveProps: function (nextProps){
		if(nextProps.request.search.znid != this.props.request.search.znid){
			this.__loadInfo(nextProps.request.search.znid);
		}
	},
	__loadInfo: function (znid){
		zn.http.post('/zn.plugin.admin/model/selectOne', {
			model: 'ChunRuiOASupplier',
			where: { zn_id: znid }
		}).then(function (data){
			if(data.status==200){
				this.setState({ info: data.result });
			}
		}.bind(this), function (){

		});
	},
	__onToolbarClick: function (item){
		switch (item.name) {
			case 'edit':
				zn.notification.warning('还未开发');
				break;
		}
	},
	render: function(){
		return (
			<zn.react.Page
				title={this.state.info?this.state.info.zn_title:"正在加载中..."}
				headerCenter={<zn.react.ListView
					className="zr-tab-ios"
					selectMode="radio"
					valueKey="view"
					onClick={(data)=>this.setState({ view: data.value })}
					value={this.state.view}
					data={[
						{ view: SupplierInfo, text: '基本信息' },
						{ view: SupplierQuote, text: '商品报价' },
						{ view: SupplierOrderWFInstance, text: '订单流程' },
						{ view: SupplierOrderDetails, text: '订单汇总' },
						{ view: SupplierSaleServices, text: '售后订单' },
						{ view: SupplierBackTicket, text: '退回订单' }
					]} />}
				toolbarItems={this.state.toolbarItems}
				onToolbarClick={this.__onToolbarClick} >
				{(this.state.info && this.state.view) && <this.state.view supplier={this.state.info.id} znid={this.props.request.search.znid} />}
			</zn.react.Page>
		);
	}
});
