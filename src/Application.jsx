import React from 'react'
import { Button, Modal } from 'react-bootstrap'
import Chess from 'chess.js'
import 'react-chessground/dist/styles/chessground.css'
import 'bootstrap/dist/css/bootstrap.css'
import hotkeys from 'hotkeys-js'
import defaultPgn from './default-pgn.js'
import niceJob from './feedback.js'
import DragAndDropFileTarget from './DragAndDropFileTarget.jsx'
import ModalDialog from './ModalDialog.jsx'
import logo from './images/logo.svg'

const Chessground = require('chessground').Chessground

class Application extends React.Component {
	validMoves() {
		const result = new Map()
		const chess = this.chess
		if (this.allowedMove) {
			result.set(this.allowedMove.from, [this.allowedMove.to])
		} else {
			chess.SQUARES.forEach(s => {
				const ms = chess.moves({ square: s, verbose: true })
				if (ms.length) result.set(s, ms.map(m => m.to))
			})
		}
		return result
	}

	constructor(props) {
		super(props)
		this.board = React.createRef()
		this.chessCoach = new Chess()
		this.state = {
			comment: `Press "F1" on your keyboard for help.`
		}
	}

	computeGameMoves(pgn) {
		const result = []
		this.chessCoach.load_pgn(pgn)
		const moves = this.chessCoach.history()
		this.chessCoach.reset()
		for (let m = 0; m < moves.length; m++) {
			const move = moves[m]
			const mv = this.chessCoach.move(move)
			mv.fen = this.chessCoach.fen()
			result.push(mv)
		}
		return result
	}

	async moveVirtual(steps) {
		if (this.state?.gameMoves) {
			let moveNumber = steps === undefined ? 0 : (steps === null ? this.state.gameMoves.length - 1 : this.state.currentMoveNumber + steps)
			if (moveNumber > this.state.gameMoves.length - 1) {
				moveNumber = this.state.gameMoves.length - 1
			}
			if (moveNumber < 0) {
				moveNumber = 0
			}
			const mv = this.state.gameMoves[moveNumber]
			if (mv) {
				await this.setState({
					currentMoveNumber: moveNumber
				})
				this.chess.clear()
				this.chess.load(mv.fen)
				const m = this.state.gameMoves[moveNumber + 1]
				if (m) {
					if (this.showHelp) {
						this.ground.setAutoShapes([{ orig: m.from, dest: m.to, brush: 'green' }])
					} else {
						this.ground.setAutoShapes([])
					}
					this.allowedMove = m
				} else {
					this.ground.setAutoShapes([])
				}
				this.ground.set(this.boardConfig())
				return m
			}
		}
	}

	async init(pgnNew) {
		// const pgn = '1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Ng4 5. h3 h5 6. hxg4 hxg4 7. Ne1 Qh4 8. f3 g3 { [%csl Gf2][%cal Gg3f2] } 9. Bxc6 Qh1# *'
		const pgn = pgnNew || '1. d4 d5 2. c4 e5 3. dxe5 d4 4. e3? Bb4+ 5. Bd2 dxe3! 6. Bxb4 exf2+ 7. Ke2 (7. Kxf2 Qxd1 $19) 7... fxg1=N+! (7... fxg1=Q? 8. Qxd8+ Kxd8 9. Rxg1) 8. Rxg1 Bg4+ $19 { [%csl Rd1,Re2][%cal Bg4d1] } *'
		const gameMoves = this.computeGameMoves(pgn)
		// console.log(this.state.gameMoves)
		this.chess = new Chess()
		this.allowedMove = gameMoves[0]
		this.ground = Chessground(this.board.current, this.boardConfig())
		this.ground.setAutoShapes([])
		await this.setState({
			currentMoveNumber: -1,
			gameMoves
		})

		await this.moveVirtual(1)
	}

	async registerHotKeys() {
		const functions = [
			{
				hotkey: 'f1',
				text: 'show help',
				fn: (e) => {
					e.preventDefault()
					this.setState({
						showApplicationHelp: true
					})
				}
			},
			{
				hotkey: 'h',
				text: 'show hint',
				fn: (e) => {
					e.preventDefault()
					this.showHelp = !this.showHelp
					this.moveVirtual(0)
				}
			},
			{
				hotkey: 'ctrl+right',
				text: 'show last move',
				fn: (e) => {
					e.preventDefault()
					this.moveVirtual(null)
				}
			},
			{
				hotkey: 'ctrl+left',
				text: 'show first move',
				fn: (e) => {
					e.preventDefault()
					this.moveVirtual(undefined)
				}
			},
			{
				hotkey: 'ctrl+up',
				text: 'show next game',
				fn: (e) => {
					e.preventDefault()
					const game = this.state.games[this.state.game.index + 1] || this.state.games[0]
					this.loadGame(game)
				}
			},
			{
				hotkey: 'ctrl+down',
				text: 'show previous game',
				fn: (e) => {
					e.preventDefault()
					const game = this.state.games[this.state.game.index - 1] || this.state.games[this.state.games.length - 1]
					this.loadGame(game)
				}
			},
			{
				hotkey: 'left',
				text: 'show previous move',
				fn: (e) => {
					e.preventDefault()
					this.moveVirtual(-1)
				}
			},
			{
				hotkey: 'right',
				text: 'show next move',
				fn: (e) => {
					e.preventDefault()
					this.moveVirtual(+1)
				}
			}
		]
		this.setState({functions})
		functions.map(f => hotkeys(f.hotkey, f.fn.bind(this)))
	}

	async componentDidMount() {
		this.registerHotKeys()
		this.onDropSettingsFile()
	}

	boardConfig() {
		const config = {
			fen: this.chess.fen(),
			turnColor: this.chess.turn() === 'w' ? 'white' : 'black',
			orientation: 'black',
			movable: {
				free: true, // all moves are valid - board editor
				dests: this.validMoves(),
				dropOff: 'revert', // when a piece is dropped outside the board. "revert" | "trash"
				showDests: true // add the move-dest class to squares
			},
			highlight: {
				lastMove: true,
				check: true
			}
		}
		config.movable.events = {
			select: (key) => {
				// console.log(key)
			},
			after: this.onMove.bind(this)
		}

		return config
	}

	componentWillUnmount() {
		if (this.ground) { this.ground.destroy() }
	}

	async onMove(from, to, metadata) {
		// console.log(from, to, metadata)
		if (this.allowedMove) {
			let promotion
			if (this.allowedMove.promotion !== undefined) {
				promotion = (await this.choosePromotionPiece() || 'x')
			}
			if (to === this.allowedMove.to && this.allowedMove.promotion === promotion) {
				const mv = this.chess.move({ from, to, promotion: this.allowedMove.promotion || 'x' })
				if (mv) {
					this.setState({
						comment: `${niceJob.goody()} ${niceJob.good()}`,
						commentState: 'success'
					})
					await this.moveVirtual(2)
				} else {
					this.setState({
						comment: `${niceJob.bady()} ${niceJob.bad()}`,
						commentState: 'warning'
					})
				}
			} else {
				this.setState({
					comment: `${niceJob.bady()} ${niceJob.bad()}`,
					commentState: 'warning'
				})
			}
		} else {
			if (this.chess.move({ from, to, promotion: 'x' })) {
				// console.log('moved')
			} else {
				this.setState({
					comment: niceJob.bad(),
					commentState: 'warning'
				})
			}
		}
		this.ground.set(this.boardConfig())
		// setTimeout(this.randomMove.bind(this), 500)
	}

	randomMove() {
		const moves = this.chess.moves({ verbose: true })
		const move = moves[Math.floor(Math.random() * moves.length)]
		if (moves.length > 0) {
			this.chess.move(move.san)
			this.setState({
				fen: this.chess.fen(),
				turnColor: this.turnColor(),
				validMoves: this.validMoves()
			})
		}
	}

	choosePromotionPiece() {
		const self = this
		return new Promise(function(resolve/* , reject */) {
			self.setState({
				showPromotionDialog: true,
				onClosePromotionDialog: async (result) => {
					await self.setState({
						showPromotionDialog: false
					})
					resolve(result)
				}
			})
		})
	}

	parsePgn(pgn) {
		const result = {}

		const code = pgn.split('\n\n')
		result.pgn = (code[code.length - 1])
		const propertyLines = []
		const rxLines = /(?<=\[).+?(?=\])/g
		let res

		while ((res = rxLines.exec(pgn)) !== null) {
			propertyLines.push(res)
		}

		for (let l = 0; l < propertyLines.length; l++) {
			const line = propertyLines[l]
			const key = line[0].split(' "')[0]
			const rxPropertyContent = /(?<=").+?(?=")/g
			while ((res = rxPropertyContent.exec(line[0])) !== null) {
				result[key] = res[0]
			}
		}
		delete result.Result

		return result
	}

	loadGame(game) {
		if (game) {
			window.document.title = game.Opening || ''
			this.init(game.pgn)
			window.scrollTo(0, 0)
			this.setState({
				game
			})
		}
	}

	onDropSettingsFile(data) {
		const pgns = (data?.body || defaultPgn).split('\n\n\n')
		const games = []
		for (let g = 0; g < pgns.length; g++) {
			const pgn = pgns[g]
			const game = this.parsePgn(pgn)
			game.index = g
			games.push(game)
		}

		const game = games[0]
		this.setState({
			games,
			game
		})
		this.loadGame(game)
	}

	render() {
		return (
			<div className="app">
				<br/>
				<div className="container-fluid">
					<div className="row">
						<div className="col-6">
							<div ref={this.board} ></div>
						</div>
						<div className="col-6">
							{this.state?.comment ? <div className={`alert alert-${this.state?.commentState || 'info'}`} role="alert">
								{this.state?.comment}
							</div> : (null)}

							<ul className="list-group">
								<li className="list-group-item"><strong>{this.state?.game?.Event}</strong> ({this.state?.game?.index + 1}/{this.state?.games?.length })</li>
								<li className="list-group-item"><strong>Move</strong> {this.state?.currentMoveNumber + 1}/{this.state?.gameMoves?.length ? this.state?.gameMoves?.length : ''}</li>
								<li className="list-group-item"><strong>Opening</strong> {this.state?.game?.Opening}</li>
								<li className="list-group-item"><strong>URL</strong> {this.state?.game?.Site}</li>
								<li className="list-group-item"><strong>FEN</strong> {this.state?.game?.FEN}</li>
								<li className="list-group-item"><strong>PGN</strong> {this.state?.game?.pgn}</li>
								<li className="list-group-item"><strong>Author</strong> {this.state?.game?.Annotator}</li>
								<li className="list-group-item"><strong>Repertoire</strong></li>
								<li className="list-group-item">
									<ol>
										{(this.state?.games || []).map(g => {
											return <li key={`${g.Event}-${g.Opening}`}>
												<a href="javascript:void(0)" onClick={this.loadGame.bind(this, g)} type="button" className="">{g.Opening}</a>
											</li>
										})}
									</ol>
								</li>
								<li className="list-group-item">
									<div className="row">
										<div className="col">
											<button onClick={this.onDropSettingsFile.bind(this)} type="button" className="btn btn-secondary btn-sm">Load Default Chess Study</button>
										</div>
										<div className="col">
											<DragAndDropFileTarget onDrop={this.onDropSettingsFile.bind(this)}></DragAndDropFileTarget>
										</div>
									</div>
								</li>
							</ul>
						</div>
					</div>
				</div>
				<Modal show={this.state?.showApplicationHelp} onHide={() => this.setState({showApplicationHelp: false})}>
					<Modal.Header closeButton>
						<Modal.Title id="contained-modal-title-vcenter">
							Keyboard Input
						</Modal.Title>
					</Modal.Header>
					<Modal.Body>
						<div className="container-fluid">
							<div className="row">
								<div className="col">
									<img className="img-fluid" src={logo} alt="" srcSet="" />
								</div>
								<div className="col">
									{(this.state?.functions || []).map(f => {
										return <span className="hotkey-description" key={`hotkey-help-${f.hotkey}`}><kbd>{f.hotkey}</kbd> {f.text}</span>
									})}
								</div>
							</div>
						</div>
					</Modal.Body>
					<Modal.Footer>
						<Button onClick={() => this.setState({showApplicationHelp: false})}>Close</Button>
					</Modal.Footer>
				</Modal>

				<ModalDialog show={this.state.showPromotionDialog} onHide={this.state?.onClosePromotionDialog}></ModalDialog>
			</div>
		)
	}
}

export default Application