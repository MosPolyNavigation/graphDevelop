import {Settings} from "./Settings.js";
import {compare} from './functions_LiveGraph.js'

class Vertex {
	constructor(x, y, id = '', type = '') {
		this.id = id
		this.x = x
		this.y = y
		this.type = type
		this.neighboringIDs = new Set()
	}
	
	// isSame(vertexOther) {
	// 	return this.x === vertexOther.x && this.y === vertexOther.y
	// }
}

class Edge {
	id;
	idVertex1;
	idVertex2;
	weight;
	type
	
	constructor(id = '', idVertex1 = '', idVertex2 = '', weight = 0, type = '') {
		this.id = id
		this.idVertex1 = idVertex1
		this.idVertex2 = idVertex2
		this.weight = weight
		this.type = type
	}
}

export class Graph {
	vertexes = [] //список вершин
	vertexIdIterator = 0 //итератор для вершин в списке
	rawEdges = [] //сырой список рёбер со свойствами
	edges = []
	$graphObject
	floorName = ''
	
	constructor($graphObject, floorName) {
		this.$graphObject = $graphObject
		this.floorName = floorName.substring(floorName.lastIndexOf('/')+1, floorName.lastIndexOf('.svg')).toLowerCase()
	}
	
	addVertexByXY(x, y, type = '') {
		if (!this.getVertexByXY(x,y)) {
			this.vertexes.push(new Vertex(x, y, `${this.floorName}_${this.vertexIdIterator}`, type))
			this.vertexIdIterator ++
		}
	} //добавляет вершину с координатами
	
	getVertexByXY(x, y) {
		return this.vertexes.find(vertex => {
			if(vertex.x === x && vertex.y === y) return true
		})
	} //возвращает объект вершины по координатам
	
	getVertexByID(id = '') {
		return this.vertexes.find(vertex => {
			if(vertex.id === id) return true
		})
	} //возвращает объект вершины по id
	
	getDistanceBetween2VertexesByID(idVertex1, idVertex2) {
		let vertex1 = this.getVertexByID(idVertex1)
		let vertex2 = this.getVertexByID(idVertex2)
		if(vertex1.neighboringIDs.has(vertex2.id)) {
			return Number((((vertex2.x - vertex1.x) ** 2 + (vertex2.y - vertex1.y) ** 2) ** 0.5).toFixed(2))
		}
	} //возвращает длину прямого отрезка между двумя вершинами (потом переписать на расстояние из графа)

//---->ПРОЦЕСС ЗАПОЛНЕНИЯ
	tracing($tableOfEdges) { //трассировка - парсинг путей и добавление их в таблицу
		let allPaths = this.$graphObject.contentDocument.getElementsByTagName('path') //все path на картинке
		
		function getGraphPaths() {
			let paths = []
			for (let path of allPaths) {
				/*
				ЗДЕСЬ НАСТРАИВАЕТСЯ ЦВЕТ РЕБРА
				 */
				let edgeColor = '#FF5F5F'
				if (path.getAttribute('stroke') === edgeColor) paths.push(path)
			}
			return paths
		}
		
		let graphPaths = getGraphPaths() //path рёбер графа с картинки по цвету
		
		function parseEdgesFromPaths(path) {
			let id = path.getAttribute('id')
			
			
			let coordinates = path.getAttribute('d').substring(1).replaceAll('.5', '')
			
			let firstSpace = coordinates.indexOf(' ')
			let x1, y1, x2, y2
			
			x1 = coordinates.substring(0, firstSpace)
			
			coordinates = coordinates.substring(firstSpace + 1)
			
			// let lineType = ''
			let secondLetterPosition;
			
			
			if (coordinates.indexOf('H') !== - 1) {
				// lineType = 'horizontal'
				secondLetterPosition = coordinates.indexOf('H')
				y1 = coordinates.substring(0, secondLetterPosition)
				y2 = y1
				x2 = coordinates.substring(secondLetterPosition + 1)
			}
			else if (coordinates.indexOf('V') !== - 1) {
				// lineType = 'vertical'
				secondLetterPosition = coordinates.indexOf('V')
				y1 = coordinates.substring(0, secondLetterPosition)
				x2 = x1
				y2 = coordinates.substring(secondLetterPosition + 1)
			}
			else if (coordinates.indexOf('L') !== - 1) {
				secondLetterPosition = coordinates.indexOf('L')
				y1 = coordinates.substring(0, secondLetterPosition)
				coordinates = coordinates.substring(secondLetterPosition + 1)
				let secondSpace = coordinates.indexOf(' ')
				x2 = coordinates.substring(0, secondSpace)
				y2 = coordinates.substring(secondSpace + 1)
			}
			
			if (x1 >= x2 && y1 >= y2) {
				let t = x2
				x2 = x1
				x1 = t
				t = y2
				y2 = y1
				y1 = t
			}
			
			let weight = Number((((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5).toFixed(2))
			return {
				id: id,
				x1: Number(x1),
				y1: Number(y1),
				x2: Number(x2),
				y2: Number(y2),
				weight: weight,
				type: 'same-floor'
			}
		} //возвращает свойства ребра из элемента path с картинки
		let edgesProperties = [] //список ребер со свойствами
		graphPaths.forEach(path => {
			edgesProperties.push(parseEdgesFromPaths(path))
			path.setAttribute('stroke-width', '3')
		})  //создаем список рёбер со свойствами
		
		function addTdToTr(value, cellClass, tr) {
			let td = document.createElement('td')
			td.innerHTML = value
			td.setAttribute('class', String(cellClass))
			tr.appendChild(td)
		} //добавление ячеек в строку
		function timeoutAppendRowToTable(row) {
			$tableOfEdges.appendChild(row)
		} //добавление строки в таблицу с таймаутом
		let timeout = 0
		edgesProperties.forEach(edge => {
			let row = document.createElement('tr')
			addTdToTr(edge.id, 'id', row)
			addTdToTr(edge.x1, 'id', row)
			addTdToTr(edge.y1, 'id', row)
			addTdToTr(edge.x2, 'id', row)
			addTdToTr(edge.y2, 'id', row)
			addTdToTr(edge.weight, 'id', row)
			addTdToTr(edge.type, 'id', row)
			setTimeout(timeoutAppendRowToTable, timeout, row)
			timeout += 50
		}) //формирование таблицы из списка рёбер
		this.rawEdges = edgesProperties
		
		console.log('Сырой список рёбер: ')
		console.table(this.rawEdges)
	} // трассировка: по элементам свг-картинки графа делает сырой список рёбер и заносит их в таблицу, записывает в
      // rawEdges ребра со свойствами
	
	createVertexesList() {
		for (let rawEdge of this.rawEdges) {
			this.addVertexByXY(rawEdge.x1, rawEdge.y1, 'hallway')
			this.addVertexByXY(rawEdge.x2, rawEdge.y2, 'hallway')
		}
		console.table(this.vertexes)
	}
	
	fillGraph() {
		console.group('Заполнение графа')
		for (let rawEdge of this.rawEdges) {
			let vertex1 = this.getVertexByXY(rawEdge.x1, rawEdge.y1)
			let vertex2 = this.getVertexByXY(rawEdge.x2, rawEdge.y2)
			console.log('Заполняется ребро(', rawEdge.x1, rawEdge.y1, ')(', rawEdge.x2, rawEdge.y2, ')')
			let type
			if (vertex1.type === 'entranceToAu' || vertex2.type === 'entranceToAu') type = 'entranceToAu'
			else type = rawEdge.type
			
			/*
			Здесь можно добавить чтобы была длина у лестниц / входов в лестницы побольше
			 */
			
			let edge = new Edge(
				rawEdge.id,
				vertex1.id,
				vertex2.id,
				rawEdge.weight,
				type)
			this.edges.push(edge)
			
			vertex1.neighboringIDs.add(vertex2.id)
			vertex2.neighboringIDs.add(vertex1.id)
		}
		
		console.groupCollapsed('Готовый граф')
		console.log('Готовый список рёбер')
		console.table(this.edges)
		console.log('Готовый список вершин')
		console.table(this.vertexes)
		console.log('Осталось добавить параметры экспорта')
		console.groupEnd()
	}
	
	tracingCross() {
		//Функция возвращает принадлежит ли точка (x,y) отрезку {(x1,y1);(x2,y2)} или находится на расстоянии меньше 1
		// от этого отрезка
		function isPointOnLineSegment(x1, y1, x2, y2, x, y) {
			// Вычисляем длину отрезка AB
			const lengthAB = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
			
			// Вычисляем отношение расстояния от точки A до точки C к длине отрезка AB
			const k = Math.min(1, Math.max(0, ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / (lengthAB ** 2)));
			
			// Вычисляем координаты точки C
			const xc = x1 + (x2 - x1) * k;
			const yc = y1 + (y2 - y1) * k;
			
			// Вычисляем расстояние от точки C до точки (x, y)
			const distance = Math.sqrt((xc - x) ** 2 + (yc - y) ** 2);
			
			// Проверяем условие и возвращаем результат
			return distance <= 1 && (k > 0 && k < 1);
		}
		
		//
		
		
		console.group('ТРАССИРОВКА ПРИМЫКАЮЩИХ ЛИНИЙ')
		let hallwayVertexes = []
		for (let vertex of this.vertexes) {
			if (vertex.type === 'hallway') hallwayVertexes.push(vertex)
		}
		let count = 0
		let splittingEdges = new Map()
		for (let vertex of hallwayVertexes) {
			for (let edge of this.edges) {
				if (edge.idVertex1 !== vertex.id && edge.idVertex2 !== vertex.id) {
					let {x: x1, y: y1} = this.getVertexByID(edge.idVertex1)
					let {x: x2, y: y2} = this.getVertexByID(edge.idVertex2)
					let {x: x, y: y} = vertex
					if (isPointOnLineSegment(x1, y1, x2, y2, x, y)) {
						console.log(`Точка (${x},${y}) принадлежит отрезку {(${edge.id})}`)
						if (splittingEdges.get(edge) === undefined) {
							splittingEdges.set(edge, [])
						}
						splittingEdges.get(edge).push(vertex)
						count ++
					}
				}
			}
		}
		console.log('Итого количество разделяющих точек', count)
		console.table(splittingEdges)
		
		function getSplitEdges(edge, vertexes) {
			let vertex1 = vertexes.shift()
			let splitEdges = []
			for (let vertex2 of vertexes) {
				let {x: x1, y: y1} = vertex1
				let {x: x2, y: y2} = vertex2
				let type = 'same-floor'
				if (vertex1.type === 'entranceToAu' || vertex2.type === 'entranceToAu') type = 'entranceToAu'
				let weight = Number((((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5).toFixed(2))
				splitEdges.push(new Edge(
					String(iterator),
					vertex1.id,
					vertex2.id,
					weight,
					type))
				vertex1.neighboringIDs.add(vertex2.id)
				vertex2.neighboringIDs.add(vertex1.id)
				vertex1 = vertex2
				iterator ++
			}
			return splitEdges
		}
		
		let iterator = 0
		for (let [edge, vertexes] of splittingEdges) {
			vertexes.unshift(this.getVertexByID(edge.idVertex1))
			vertexes.unshift(this.getVertexByID(edge.idVertex2))
			vertexes.sort(compare('y'))
			vertexes.sort(compare('x'))
			console.table(vertexes)
			
			let splitEdges = getSplitEdges(edge, vertexes)
			console.log('Разделенные ребра', splitEdges)
			
			let index = this.edges.indexOf(edge)
			
			console.log(edge, this.getVertexByID(edge.idVertex1).neighboringIDs);
			this.getVertexByID(edge.idVertex1).neighboringIDs.delete(edge.idVertex2)
			this.getVertexByID(edge.idVertex2).neighboringIDs.delete(edge.idVertex1)
			
			this.edges.splice(index, 1, ...splitEdges)
			
		}
		console.groupEnd()
	}
	
	fillAuditoriumsVertexes(auditoriumsEntrances, $svgPlan) {
		for (const [auditoriumID, entranceID] of auditoriumsEntrances) {
			let $entrance = $svgPlan.getElementById(entranceID)
			if ($entrance !== null) {
				let cx = Number($entrance.getAttribute('cx'))
				let cy = Number($entrance.getAttribute('cy'))
				let vertex = this.getVertexByXY(cx, cy)
				if (vertex !== undefined) {
					let oldVertexId = vertex.id
					vertex.id = auditoriumID
					for (let vertexWithNeighbors of this.vertexes) {
						if(vertexWithNeighbors.neighboringIDs.has(oldVertexId)){
							vertexWithNeighbors.neighboringIDs.delete(oldVertexId)
							vertexWithNeighbors.neighboringIDs.add(vertex.id)
						}
					}
					for (let edge of this.edges) {
						if(edge.idVertex1===oldVertexId) edge.idVertex1=vertex.id
						if(edge.idVertex2===oldVertexId) edge.idVertex2=vertex.id
					}
					vertex.type = 'entrancesToAu'
				}
			}
			else {
				`Не найдена точка входа с айди${entranceID}, поправьте таблицу ассоциаций`
			}
		}
	}
	
	defineVertexesTypes() {
		// Функция переопределяет типы вершин
		for (let vertex of this.vertexes) {
			if (vertex.id.indexOf('lift') > 0) {
				vertex.type = 'lift' // Тип лифтов
			} else if (vertex.id.indexOf('stair') > 0) {
				vertex.type = 'stair' // Тип лестниц
			} else if (vertex.id.indexOf('crossing') > 0) {
				vertex.type = 'crossing' // Тип перехода между копрусами
			} else if (vertex.neighboringIDs.size > 1 && vertex.type === 'entrancesToAu') {
				vertex.type = 'crossingSpace' // Тип проходных помещений
			}
		}
		let groupedVertexes = this.vertexes.reduce((acc, vertex) => {
			let key = vertex.type === 'lift' || vertex.type === 'stair' || vertex.type === 'corpusTransition' || vertex.type === 'crossingSpace'  ? 'С измененным типом' : 'С неизмененным типом';
			acc[key] = acc[key] || [];
			acc[key].push(vertex);
			return acc;
		}, {});
		console.table(groupedVertexes['С измененным типом'])
	}
	
	makeNeighboringIDsAsArray() {
		for (let vertex of this.vertexes) {
			let intermediateArr = []
			for (let neighborId of vertex.neighboringIDs) {
				intermediateArr.push([neighborId, this.getDistanceBetween2VertexesByID(vertex.id,neighborId)])
			}
			delete vertex.neighboringIDs
			vertex.neighborData = [...intermediateArr]
		}
		console.log(this.vertexes)
	}
	
	showGraph($graphMarkers, $similarElement) {
		$graphMarkers.style.display = 'block'
		$graphMarkers.setAttribute('viewBox', $similarElement.getAttribute('viewBox'))
		for (let vertex of this.vertexes) {
			// let $idEl = document.createElement('div')
			let $idEl = document.createElementNS('http://www.w3.org/2000/svg', 'text')
			$idEl.classList.add('vertex-id')
			let $idElTspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan')
			$idElTspan.setAttribute('x', `${vertex.x-vertex.id.length*6}`)
			$idElTspan.setAttribute('y', `${vertex.y}`)
			$idElTspan.innerHTML = vertex.id
			$idEl.appendChild($idElTspan)
			$graphMarkers.appendChild($idEl)
			$graphMarkers.innerHTML += `
			<circle cx=${vertex.x} cy=${vertex.y} r="4" fill="#FF5F5F" fill-opacity="1"></circle>
			`
		}
		
		for (let edge of this.edges) {
			let $idEl = document.createElement('div')
			let vertex1 = this.getVertexByID(edge.idVertex1)
			let vertex2 = this.getVertexByID(edge.idVertex2)
			let left = ((vertex1.x + vertex2.x) / 2).toFixed(0)
			let top = ((vertex1.y + vertex2.y) / 2 - 7).toFixed(0)
			$idEl.classList.add('edge-id')
			$idEl.style.left = `${left}px`
			$idEl.style.top = `${top}px`
			// $idEl.innerHTML = edge.id.replace('Vector ', '')+'<br>'+edge.weight
			$idEl.innerHTML = edge.weight
			$graphMarkers.appendChild($idEl)
		}
	}
	
	getShortestWayFromTo(idVertex1, idVertex2) {
		let start = Date.now()
		
		function isVertexNeedCheck(vertex){
			return (vertex.type === 'hallway' ||
				vertex.type === 'lift' ||
				vertex.type === 'stair' ||
				vertex.type === 'corpusTransition' ||
				vertex.type === 'crossingSpace' ||
				vertex.id === idVertex1 ||
				vertex.id === idVertex2 ||
				Settings.throughPassVertexes.includes(vertex.id)
			)
		}
		
		let filteredVertexes = this.vertexes.filter((vertex) => isVertexNeedCheck(vertex))
		//Список вершин находящиеся только в коридорах
		let distances = new Map() //расстояния до вершин от начальной точки (старта)
		let ways = new Map() //маршруты из точек
		for (let vertex of filteredVertexes) { // для всех вершин устанавливаем бесконечную длину пути
			distances.set(vertex.id, Infinity)
			ways.set(vertex.id, [])
		}
		distances.set(idVertex1, 0) //для начальной вершины длина пути = 0
		
		let finals = new Set() //вершины с окончательной длиной (обработанные вершины)
		
		let currentVertexID = idVertex1 //ид обрабатываемой вершины
		// for (let i = 0; i < 2; i ++) {
		let iterations = [0, 0] //счётчик количества итераций внешнего и внутреннего циклов
		let isEndVertexInFinals = false //Флаг находится ли конечная вершина в обработанных
		while (finals.size !== filteredVertexes.length && !isEndVertexInFinals) { //пока не посетили все вершины (или пока не обнаружено, что
			// граф не связный) или пока не обработана конечная вершина
			iterations[0]+=1

			//релаксации для соседних вершин
			let currentVertexDistance = distances.get(currentVertexID) //длина до обрабатываемой вершины
			for (let [neighborId, distanceToNeighbor] of this.getVertexByID(currentVertexID).neighborData) { //для всех айдишников соседей вершины по айди
				if(!filteredVertexes.includes(this.getVertexByID(neighborId)))
					continue
				iterations[1]+=1
				let distanceBetweenCurrentAndNeighbor = distanceToNeighbor
				//расстояние между обрабатываемой и соседней вершиной
				let neighborDistance = distances.get(neighborId) //расстояние до соседней вершины от старта
				
				//если расстояние до обр верш + между соседней < расст до соседней вершины от старта
				if (currentVertexDistance + distanceBetweenCurrentAndNeighbor < neighborDistance) {
					//обновляем расстояние до соседней вершины
					distances.set(neighborId, currentVertexDistance + distanceBetweenCurrentAndNeighbor)
					//и путь для нёё, как путь до текущей вершины + текущая вершина
					let wayToRelaxingVertex = Array.from(ways.get(currentVertexID))
					wayToRelaxingVertex.push(currentVertexID)
					ways.set(neighborId, wayToRelaxingVertex)
				}
				
			}
			
			finals.add(currentVertexID) //помечаем текущую вершину как обработканную
			if(currentVertexID === idVertex2)
				isEndVertexInFinals = true
			//поиск следующей обрабатываемой вершины (необработанная вершина с наименьшим расстоянием от начала)
			let minDistance = Infinity
			let nextVertexID = ''
			for (let [id, distance] of distances) {
				if (distance < minDistance && (!finals.has(id))) {
					minDistance = distance
					nextVertexID = id
					// console.log(minDistance, nextVertexID)
				}
			}
			if (minDistance === Infinity) //если граф несвязный то закончить поиск путей
				break
			currentVertexID = nextVertexID
		}
		
		for (let [id, way] of ways) {
			way.push(id)
		}
		
		// console.log(distances)
		// console.log(ways)
		console.log(`Путь найден за ${Date.now() - start} миллисекунд с количеством итераций ${iterations[0]}, ${iterations[1]} и количеством вершин ${filteredVertexes.length}`)
		return {
			way: ways.get(idVertex2),
			distance: Math.floor(distances.get(idVertex2))
		}
	}
}