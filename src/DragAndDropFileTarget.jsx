import React from 'react'

class DragAndDropFileTarget extends React.Component {
	constructor(props) {
		super(props)
		this.holder = React.createRef()
	}

	componentDidMount() {
		const self = this
		const holder = this.holder.current

		holder.ondrop = function(e) {
			this.className = ''
			e.preventDefault()

			const file = e.dataTransfer.files[0]
			const reader = new window.FileReader()
			reader.onload = function(event) {
				self.props.onDrop({body: event.target.result})
			}
			reader.readAsText(file)

			return false
		}
	}

	render() {
		return <div>
			<div onDragOver = {(event) => {
				event.preventDefault()
			}} ref={this.holder} className="drag-and-drop-target-holder">
				<small>
					<i>Drag and Drop a study you previously downloaded from lichess.org</i>
				</small>
			</div>
		</div>
	}
}

export default DragAndDropFileTarget