var React = require('react');

module.exports = React.createClass({
	getInitialState: function () {
		return {
			info: null
		}
	},
	componentDidMount: function (){
		this.__loadBaseInfo(this.props.znid);
	},
	__loadBaseInfo: function (zn_id){
		zn.http.post('/zn.plugin.admin/model/selectOne', {
			model: 'ChunRuiOASupplier',
			where: { zn_id: zn_id }
		}).then(function (data){
			this.setState({ info: data.result });
		}.bind(this));
	},
	render:function(){
		if(!this.state.info){
			return <zn.react.DataLoader content="正在加载中..." loader="timer" />;
		}
		return (
			<div className="zn-plugin-admin-base-info oa-admin-user-customer-info">
				<div className="right">
					<div className="base">
						{this.state.info.logo_img && <img className="logo" src={zn.http.fixURL(this.state.info.logo_img)} />}
						<span className="title">{this.state.info.zn_title}</span>
					</div>
					<div className="account">
						<div className="info">账户余额(元)：<span className="amount">￥{(this.state.info.amount||0).toFixed(2)}</span></div>
						<div className="action">
							<zn.react.Button text="充值" icon="fa-sign-in" status="warning" style={{width: 100}} />
							<zn.react.Button text="账单" icon="fa-list-ul" style={{width: 100}} />
						</div>
					</div>
					<div className="item-group">
						<div className="group-title">联系方式</div>
						<div className="item">
							<span className="item-key">姓名: </span>
							<span className="item-value">{this.state.info.name}</span>
						</div>
						<div className="item">
							<span className="item-key">邮箱: </span>
							<span className="item-value">{this.state.info.email}</span>
						</div>
						<div className="item">
							<span className="item-key">电话号码: </span>
							<span className="item-value">{this.state.info.phone}</span>
						</div>
						<div className="item">
							<span className="item-key">地址: </span>
							<span className="item-value">{this.state.info.address}</span>
						</div>
						<div className="item">
							<span className="item-key">说明: </span>
							<span className="item-value">{this.state.info.zn_note}</span>
						</div>
						<div className="item">
							<span className="item-key">创建时间: </span>
							<span className="item-value">{this.state.info.zn_create_time}</span>
						</div>
					</div>
				</div>
			</div>
		);
	}
});
