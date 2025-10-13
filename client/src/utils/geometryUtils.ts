// src/utils/geometryUtils.ts

import * as THREE from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { FaceGroup, ConnectedGroup, SharedEdge } from '@/types/three'

function readVertex(
  attr: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
  index: number,
  target = new THREE.Vector3(),
) {
  if ((attr as any).isInterleavedBufferAttribute) {
    const a = attr as THREE.InterleavedBufferAttribute
    target.set(a.getX(index), a.getY(index), a.getZ(index))
  } else {
    target.fromBufferAttribute(attr as THREE.BufferAttribute, index)
  }
  return target
}

function areFacesAdjacent(
  face1Index: number,
  face2Index: number,
  position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
): boolean {
  const vertices1: THREE.Vector3[] = []
  const vertices2: THREE.Vector3[] = []
  let sharedVertices = 0

  for (let i = 0; i < 3; i++) {
    const idx1 = face1Index * 3 + i
    const idx2 = face2Index * 3 + i
    vertices1.push(readVertex(position, idx1, new THREE.Vector3()))
    vertices2.push(readVertex(position, idx2, new THREE.Vector3()))
  }

  for (const v1 of vertices1) {
    for (const v2 of vertices2) {
      if (v1.distanceTo(v2) < 1e-6) sharedVertices++
    }
  }
  return sharedVertices >= 2
}

function classifyFaceGroups(groups: FaceGroup[]): void {
  const upVector = new THREE.Vector3(0, 1, 0)
  for (const group of groups) {
    const angle = group.normal.angleTo(upVector)
    if (angle < Math.PI / 4) {
      group.type = 'top'
    } else if (angle > (Math.PI * 3) / 4) {
      group.type = 'bottom'
    } else {
      group.type = 'side'
    }
  }
}

function findGroupConnections(groups: FaceGroup[], position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute): void {
  for (let i = 0; i < groups.length; i++) {
    for (let j = i + 1; j < groups.length; j++) {
      const sharedEdge = findSharedEdge(groups[i], groups[j], position)
      if (sharedEdge) {
        groups[i].connectedGroups.push({
          group: groups[j],
          edge: sharedEdge,
        })
        groups[j].connectedGroups.push({
          group: groups[i],
          edge: {
            start: sharedEdge.end,
            end: sharedEdge.start,
            normal1: sharedEdge.normal2,
            normal2: sharedEdge.normal1,
          },
        })
      }
    }
  }
}

function createSideFaceMesh(sideGroups: FaceGroup[], position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute): THREE.Group {
  const orderedSideGroups: FaceGroup[] = []

  let currentGroup = sideGroups[0]
  orderedSideGroups.push(currentGroup)

  while (orderedSideGroups.length < sideGroups.length) {
    const nextGroup = currentGroup.connectedGroups.find(
      (conn) => conn.group.type === 'side' && !orderedSideGroups.includes(conn.group),
    )?.group

    if (nextGroup) {
      orderedSideGroups.push(nextGroup)
      currentGroup = nextGroup
    } else {
      break
    }
  }

  const groupInfos: Array<{
    startX: number
    width: number
    height: number
    group: FaceGroup
  }> = []
  let totalWidth = 0

  orderedSideGroups.forEach((group) => {
    const box = new THREE.Box3()
    let width = 0
    let height = 0

    group.faces.forEach((faceIndex) => {
      const vertices: THREE.Vector3[] = []
      for (let i = 0; i < 3; i++) {
        const idx = faceIndex * 3 + i
        const vertex = readVertex(position, idx, new THREE.Vector3())
        vertices.push(vertex)
        box.expandByPoint(vertex)
      }
    })

    const size = box.getSize(new THREE.Vector3())
    width = Math.max(size.x, size.z)
    height = size.y

    groupInfos.push({
      startX: totalWidth,
      width: width,
      height: height,
      group: group,
    })

    totalWidth += width
  })

  const maxHeight = Math.max(...groupInfos.map((info) => info.height))
  const guideHeight = maxHeight * 0.4

  const mainGeometry = new THREE.BufferGeometry()
  const guideGeometry = new THREE.BufferGeometry()

  const mainVertices: number[] = []
  const mainIndices: number[] = []
  const guideVertices: number[] = []
  const guideIndices: number[] = []
  let mainVertexIndex = 0
  let guideVertexIndex = 0

  groupInfos.forEach((info) => {
    const startX = info.startX - totalWidth / 2
    const normalizedWidth = info.width
    const normalizedHeight = info.height

    guideVertices.push(
      startX,
      normalizedHeight / 2 + guideHeight,
      0,
      startX + normalizedWidth,
      normalizedHeight / 2 + guideHeight,
      0,
      startX,
      normalizedHeight / 2,
      0,
      startX + normalizedWidth,
      normalizedHeight / 2,
      0,
    )

    guideVertices.push(
      startX,
      -normalizedHeight / 2,
      0,
      startX + normalizedWidth,
      -normalizedHeight / 2,
      0,
      startX,
      -normalizedHeight / 2 - guideHeight,
      0,
      startX + normalizedWidth,
      -normalizedHeight / 2 - guideHeight,
      0,
    )

    guideIndices.push(
      guideVertexIndex,
      guideVertexIndex + 1,
      guideVertexIndex + 2,
      guideVertexIndex + 1,
      guideVertexIndex + 3,
      guideVertexIndex + 2,
      guideVertexIndex + 4,
      guideVertexIndex + 5,
      guideVertexIndex + 6,
      guideVertexIndex + 5,
      guideVertexIndex + 7,
      guideVertexIndex + 6,
    )
    guideVertexIndex += 8

    mainVertices.push(
      startX,
      normalizedHeight / 2,
      0,
      startX + normalizedWidth,
      normalizedHeight / 2,
      0,
      startX,
      -normalizedHeight / 2,
      0,
      startX + normalizedWidth,
      -normalizedHeight / 2,
      0,
    )

    mainIndices.push(
      mainVertexIndex,
      mainVertexIndex + 1,
      mainVertexIndex + 2,
      mainVertexIndex + 1,
      mainVertexIndex + 3,
      mainVertexIndex + 2,
    )
    mainVertexIndex += 4
  })

  mainGeometry.setAttribute('position', new THREE.Float32BufferAttribute(mainVertices, 3))
  mainGeometry.setIndex(mainIndices)
  mainGeometry.computeVertexNormals()

  guideGeometry.setAttribute('position', new THREE.Float32BufferAttribute(guideVertices, 3))
  guideGeometry.setIndex(guideIndices)
  guideGeometry.computeVertexNormals()

  const mainMaterial = new THREE.MeshStandardMaterial({
    side: THREE.DoubleSide,
    vertexColors: true,
  })

  const guideMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    vertexColors: false,
    map: null,
  })

  const mainMesh = new THREE.Mesh(mainGeometry, mainMaterial)
  const guideMesh = new THREE.Mesh(guideGeometry, guideMaterial)

  const edgesGroup = new THREE.Group()

  const mainLineOptions = {
    color: 0x000000,
    linewidth: 1,
    linecap: 'round' as const,
    linejoin: 'round' as const,
    opacity: 0.5,
    transparent: false,
    depthTest: true,
    depthWrite: true,
    blending: THREE.NormalBlending,
  }

  const guideLineOptions = {
    ...mainLineOptions,
    color: 0xff0000,
    linewidth: 1,
    opacity: 0.8,
  }

  groupInfos.forEach((info, index) => {
    const startX = -totalWidth / 2 + info.startX
    const points = [
      new THREE.Vector3(startX, info.height / 2 + guideHeight, 0.001),
      new THREE.Vector3(startX + info.width, info.height / 2 + guideHeight, 0.001),
      new THREE.Vector3(startX + info.width, info.height / 2, 0.001),
      new THREE.Vector3(startX, info.height / 2, 0.001),
      new THREE.Vector3(startX, -info.height / 2, 0.001),
      new THREE.Vector3(startX + info.width, -info.height / 2, 0.001),
      new THREE.Vector3(startX + info.width, -info.height / 2 - guideHeight, 0.001),
      new THREE.Vector3(startX, -info.height / 2 - guideHeight, 0.001),
    ]

    const verticalPoints = [
      new THREE.Vector3(startX, info.height / 2 + guideHeight, 0.001),
      new THREE.Vector3(startX, -info.height / 2 - guideHeight, 0.001),
    ]

    if (index === groupInfos.length - 1) {
      const endX = startX + info.width
      verticalPoints.push(
        new THREE.Vector3(endX, info.height / 2 + guideHeight, 0.001),
        new THREE.Vector3(endX, -info.height / 2 - guideHeight, 0.001),
      )
    }

    points.forEach((point, i) => {
      if (i % 2 === 0) {
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([point, points[i + 1]])
        const isGuideArea = i < 2 || i >= 6
        const line = new THREE.Line(
          lineGeometry,
          new THREE.LineBasicMaterial(isGuideArea ? guideLineOptions : mainLineOptions),
        )
        edgesGroup.add(line)
      }
    })

    for (let i = 0; i < verticalPoints.length; i += 2) {
      const topGuideGeometry = new THREE.BufferGeometry().setFromPoints([
        verticalPoints[i],
        new THREE.Vector3(verticalPoints[i].x, info.height / 2, 0.001),
      ])
      const topGuideLine = new THREE.Line(topGuideGeometry, new THREE.LineBasicMaterial(guideLineOptions))
      edgesGroup.add(topGuideLine)

      const mainGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(verticalPoints[i].x, info.height / 2, 0.001),
        new THREE.Vector3(verticalPoints[i].x, -info.height / 2, 0.001),
      ])
      const mainLine = new THREE.Line(mainGeometry, new THREE.LineBasicMaterial(mainLineOptions))
      edgesGroup.add(mainLine)

      const bottomGuideGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(verticalPoints[i].x, -info.height / 2, 0.001),
        verticalPoints[i + 1],
      ])
      const bottomGuideLine = new THREE.Line(bottomGuideGeometry, new THREE.LineBasicMaterial(guideLineOptions))
      edgesGroup.add(bottomGuideLine)
    }
  })

  const group = new THREE.Group()
  group.add(mainMesh)
  group.add(guideMesh)
  group.add(edgesGroup)

  return group
}

function createGroupMeshes(
  groups: FaceGroup[],
  unfoldOrder: any[],
  position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
  originalMesh: THREE.Mesh,
): THREE.Mesh[] {
  const meshes = new Map<FaceGroup | string, THREE.Object3D>()
  const groupColorsMap = new Map<FaceGroup, THREE.Color>()

  groups.forEach((group) => {
    groupColorsMap.set(group, new THREE.Color(Math.random(), Math.random(), Math.random()))
  })

  const sideGroups = groups.filter((g) => g.type === 'side')
  let sideMesh: THREE.Group | null = null

  if (sideGroups.length > 0) {
    sideMesh = createSideFaceMesh(sideGroups, position)
    const pivot = new THREE.Object3D()
    pivot.add(sideMesh)
    originalMesh.parent?.add(pivot)

    sideMesh.userData.isBaseMesh = true
    sideMesh.userData.connections = []

    meshes.set('side', pivot)
  }

  const nonSideGroups = groups.filter((g) => g.type !== 'side')

  nonSideGroups.forEach((group) => {
    const geometry = new THREE.BufferGeometry()
    const vertices: number[] = []
    const indices: number[] = []
    const colors: number[] = []
    const uvs: number[] = []
    let vertexIndex = 0

    const center = new THREE.Vector3()
    group.faces.forEach((faceIdx) => {
      for (let i = 0; i < 3; i++) {
        const idx = faceIdx * 3 + i
        const vertex = readVertex(position, idx, new THREE.Vector3())
        center.add(vertex)
      }
    })
    center.divideScalar(group.faces.length * 3)

    const boundingBox = new THREE.Box3()
    group.faces.forEach((faceIdx) => {
      for (let i = 0; i < 3; i++) {
        const idx = faceIdx * 3 + i
        const vertex = readVertex(position, idx, new THREE.Vector3())
        boundingBox.expandByPoint(vertex)
      }
    })
    const size = boundingBox.getSize(new THREE.Vector3())
    const maxSize = Math.max(size.x, size.z)

    group.faces.forEach((faceIdx) => {
      for (let i = 0; i < 3; i++) {
        const idx = faceIdx * 3 + i
        const vertex = readVertex(position, idx, new THREE.Vector3())
        vertices.push(vertex.x, vertex.y, vertex.z)

        const relativePos = vertex.clone().sub(center)
        const u = (relativePos.x / maxSize + 1) * 0.5
        const v = (relativePos.z / maxSize + 1) * 0.5
        uvs.push(u, v)

        colors.push(1, 1, 1)
      }
      indices.push(vertexIndex, vertexIndex + 1, vertexIndex + 2)
      vertexIndex += 3
    })

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    geometry.computeBoundingBox()

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
    })

    const mesh = new THREE.Mesh(geometry, material)

    const normal = group.normal.clone()
    const upVector = new THREE.Vector3(0, 0, 1)
    const rotationQuaternion = new THREE.Quaternion().setFromUnitVectors(normal, upVector)
    mesh.quaternion.premultiply(rotationQuaternion)

    mesh.position.z = -0.1

    const spacing = 0.7
    if (group.type === 'top') {
      mesh.position.y = spacing
      mesh.position.x = -spacing
    } else if (group.type === 'bottom') {
      mesh.position.y = -spacing
      mesh.position.x = -spacing
    }

    mesh.userData.originalPosition = {
      x: mesh.position.x,
      y: mesh.position.y,
      z: mesh.position.z,
    }
    mesh.userData.originalRotation = {
      x: mesh.rotation.x,
      y: mesh.rotation.y,
      z: mesh.rotation.z,
    }
    mesh.userData.originalQuaternion = mesh.quaternion.clone()
    mesh.userData.groupType = group.type

    const pivot = new THREE.Object3D()
    pivot.add(mesh)
    originalMesh.parent?.add(pivot)
    meshes.set(group, pivot)
  })

  const resultMeshes: THREE.Mesh[] = []
  let sideBaseMesh: THREE.Mesh | null = null

  for (const pivot of Array.from(meshes.values())) {
    const child0 = pivot.children[0]

    if ((child0 as any).isMesh) {
      resultMeshes.push(child0 as THREE.Mesh)
      continue
    }

    if ((child0 as any).isGroup) {
      // sideMesh 그룹 안에서 대표 메쉬(예: mainMesh)를 하나 뽑음
      const firstMesh = (child0 as THREE.Group).children.find((c) => (c as any).isMesh) as THREE.Mesh | undefined

      if (firstMesh) {
        resultMeshes.push(firstMesh)
        sideBaseMesh = firstMesh // 이후 비교용으로 저장
      }
    }
  }
  if (sideMesh) {
    resultMeshes.forEach((mesh) => {
      if (sideBaseMesh && mesh !== sideBaseMesh) {
        const foldAxis = calculateFoldAxis(mesh, sideBaseMesh, mesh.userData.groupType)
        const foldAngle = calculateFoldAngle(mesh, sideBaseMesh, mesh.userData.groupType)
        mesh.userData.foldAxis = foldAxis
        mesh.userData.foldAngle = foldAngle
        mesh.userData.parentMesh = sideBaseMesh

        const parent = sideBaseMesh.parent
        const sideConnections =
          (parent as any)?.userData?.connections ??
          sideBaseMesh.userData.connections ??
          (sideBaseMesh.userData.connections = [])
        sideConnections.push({ childMesh: mesh, foldAxis, foldAngle })
      }
    })
  }

  return resultMeshes
}

function calculateFoldAxis(
  mesh: THREE.Mesh,
  parentMesh: THREE.Mesh | THREE.Group,
  groupType?: 'top' | 'bottom' | 'side',
): THREE.Vector3 {
  if (groupType === 'top') {
    return new THREE.Vector3(1, 0, 0)
  } else if (groupType === 'bottom') {
    return new THREE.Vector3(1, 0, 0)
  } else {
    return new THREE.Vector3(0, 1, 0)
  }
}

function calculateFoldAngle(
  mesh: THREE.Mesh,
  parentMesh: THREE.Mesh | THREE.Group,
  groupType?: 'top' | 'bottom' | 'side',
): number {
  if (groupType === 'top') {
    return -Math.PI / 2
  } else if (groupType === 'bottom') {
    return Math.PI / 2
  } else {
    return 0
  }
}

export function unfoldModelWithEdges(
  mesh: THREE.Mesh,
  faceMeshesRef: React.MutableRefObject<THREE.Mesh[]>,
  unfoldedTexture: THREE.CanvasTexture | null,
): void {
  mesh.visible = false

  if (!mesh.geometry.boundingBox) {
    mesh.geometry.computeBoundingBox()
  }

  let geometry = mesh.geometry.clone()
  if (!geometry.index) {
    geometry = mergeVertices(geometry)
  }
  geometry = geometry.toNonIndexed()

  const position = geometry.attributes.position
  const faceCount = position.count / 3

  const faceGroups: FaceGroup[] = []
  const visitedFaces = new Set<number>()
  const thresholdAngle = THREE.MathUtils.degToRad(0.5)

  for (let i = 0; i < faceCount; i++) {
    if (visitedFaces.has(i)) continue

    const group: FaceGroup = {
      faces: [],
      normal: new THREE.Vector3(),
      type: null,
      center: new THREE.Vector3(),
      vertices: [],
      connectedGroups: [],
    }

    const startFaceVertices: THREE.Vector3[] = []
    for (let j = 0; j < 3; j++) {
      const idx = i * 3 + j
      startFaceVertices.push(readVertex(position, idx, new THREE.Vector3()))
    }
    const v1 = new THREE.Vector3().subVectors(startFaceVertices[1], startFaceVertices[0])
    const v2 = new THREE.Vector3().subVectors(startFaceVertices[2], startFaceVertices[0])
    group.normal = new THREE.Vector3().crossVectors(v1, v2).normalize()

    const queue = [i]
    while (queue.length > 0) {
      const currentFace = queue.shift()!
      if (visitedFaces.has(currentFace)) continue

      visitedFaces.add(currentFace)
      group.faces.push(currentFace)

      for (let j = 0; j < 3; j++) {
        const idx = currentFace * 3 + j
        const vertex = readVertex(position, idx, new THREE.Vector3())
        group.vertices.push(vertex)
      }

      for (let j = 0; j < faceCount; j++) {
        if (visitedFaces.has(j)) continue

        if (areFacesAdjacent(currentFace, j, position)) {
          const faceVertices: THREE.Vector3[] = []
          for (let k = 0; k < 3; k++) {
            const idx = j * 3 + k
            faceVertices.push(readVertex(position, idx, new THREE.Vector3()))
          }
          const edge1 = new THREE.Vector3().subVectors(faceVertices[1], faceVertices[0])
          const edge2 = new THREE.Vector3().subVectors(faceVertices[2], faceVertices[0])
          const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize()

          const angle = group.normal.angleTo(normal)
          if (angle < thresholdAngle) {
            queue.push(j)
          }
        }
      }
    }

    faceGroups.push(group)
  }

  classifyFaceGroups(faceGroups)
  findGroupConnections(faceGroups, position)

  const meshes = createGroupMeshes(faceGroups, [], position, mesh)

  meshes.forEach((meshObj) => {
    const isGroup = meshObj instanceof THREE.Group

    if (isGroup) {
      meshObj.children.forEach((child) => {
        if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).material) {
          const mesh = child as THREE.Mesh
          const material = mesh.material as THREE.MeshBasicMaterial
          material.transparent = true

          if (unfoldedTexture) {
            material.map = unfoldedTexture
            material.needsUpdate = true
          }
        }
      })

      meshObj.userData.originalPosition = meshObj.position.clone()
      meshObj.userData.originalRotation = new THREE.Euler(meshObj.rotation.x, meshObj.rotation.y, meshObj.rotation.z)
      meshObj.userData.objectType = 'group'
    } else if ((meshObj as THREE.Mesh).isMesh) {
      const material = (meshObj as THREE.Mesh).material as THREE.MeshBasicMaterial
      if (material) {
        material.transparent = true

        if (unfoldedTexture) {
          material.map = unfoldedTexture
          material.needsUpdate = true
        }
      }

      meshObj.userData.originalPosition = meshObj.position.clone()
      meshObj.userData.originalRotation = new THREE.Euler(meshObj.rotation.x, meshObj.rotation.y, meshObj.rotation.z)
      meshObj.userData.objectType = 'mesh'
    }
  })

  faceMeshesRef.current = meshes
}

export function createFaceGroups(mesh: THREE.Mesh): {
  faceGroups: FaceGroup[]
  geometry: THREE.BufferGeometry
} {
  let geometry = mesh.geometry.clone()
  if (!geometry.index) {
    geometry = mergeVertices(geometry)
  }
  geometry = geometry.toNonIndexed()

  const position = geometry.attributes.position
  const faceCount = position.count / 3

  const modelBoundingBox = new THREE.Box3()
  for (let i = 0; i < position.count; i++) {
    const vertex = readVertex(position, i, new THREE.Vector3())
    modelBoundingBox.expandByPoint(vertex)
  }
  const modelSize = modelBoundingBox.getSize(new THREE.Vector3())
  const globalScale = Math.max(modelSize.x, modelSize.y, modelSize.z)

  const faceGroups: FaceGroup[] = []
  const visitedFaces = new Set<number>()
  const thresholdAngle = THREE.MathUtils.degToRad(0.5)

  for (let i = 0; i < faceCount; i++) {
    if (visitedFaces.has(i)) continue

    const group: FaceGroup = {
      faces: [],
      normal: new THREE.Vector3(),
      type: null,
      center: new THREE.Vector3(),
      vertices: [],
      connectedGroups: [],
      boundingBox: new THREE.Box3(),
    }

    const startFaceVertices: THREE.Vector3[] = []
    for (let j = 0; j < 3; j++) {
      const idx = i * 3 + j
      startFaceVertices.push(readVertex(position, idx, new THREE.Vector3()))
    }

    const v1 = new THREE.Vector3().subVectors(startFaceVertices[1], startFaceVertices[0])
    const v2 = new THREE.Vector3().subVectors(startFaceVertices[2], startFaceVertices[0])
    group.normal = new THREE.Vector3().crossVectors(v1, v2).normalize()

    const queue = [i]
    while (queue.length > 0) {
      const currentFace = queue.shift()!
      if (visitedFaces.has(currentFace)) continue

      visitedFaces.add(currentFace)
      group.faces.push(currentFace)

      for (let j = 0; j < 3; j++) {
        const idx = currentFace * 3 + j
        const vertex = readVertex(position, idx, new THREE.Vector3())
        group.vertices.push(vertex)
        group.boundingBox.expandByPoint(vertex)
      }

      for (let j = 0; j < faceCount; j++) {
        if (visitedFaces.has(j)) continue

        if (areFacesAdjacent(currentFace, j, position)) {
          const faceVertices: THREE.Vector3[] = []
          for (let k = 0; k < 3; k++) {
            const idx = j * 3 + k
            faceVertices.push(readVertex(position, idx, new THREE.Vector3()))
          }
          const edge1 = new THREE.Vector3().subVectors(faceVertices[1], faceVertices[0])
          const edge2 = new THREE.Vector3().subVectors(faceVertices[2], faceVertices[0])
          const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize()

          const angle = group.normal.angleTo(normal)
          if (angle < thresholdAngle) {
            queue.push(j)
          }
        }
      }
    }

    group.center.copy(group.boundingBox.getCenter(new THREE.Vector3()))
    faceGroups.push(group)
  }

  classifyFaceGroups(faceGroups)

  if (!geometry.attributes.uv) {
    const uvs = new Float32Array(position.count * 2)
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
  }

  faceGroups.forEach((group) => {
    if (group.type === 'side') {
      const tangent = new THREE.Vector3(1, 0, 0)
      if (Math.abs(group.normal.dot(tangent)) > 0.9) {
        tangent.set(0, 1, 0)
      }
      const bitangent = new THREE.Vector3().crossVectors(group.normal, tangent).normalize()
      tangent.crossVectors(bitangent, group.normal).normalize()

      group.faces.forEach((faceIndex) => {
        for (let i = 0; i < 3; i++) {
          const vertexIndex = faceIndex * 3 + i
          const vertex = readVertex(position, vertexIndex, new THREE.Vector3())
          const localPos = vertex.clone().sub(group.center)

          const u = localPos.dot(tangent) / globalScale + 0.5
          const v = localPos.dot(bitangent) / globalScale + 0.5

          geometry.attributes.uv.setXY(vertexIndex, u, v)
        }
      })
    } else {
      const size = group.boundingBox.getSize(new THREE.Vector3())
      const maxSize = Math.max(size.x, size.z)

      group.faces.forEach((faceIndex) => {
        for (let i = 0; i < 3; i++) {
          const vertexIndex = faceIndex * 3 + i
          const vertex = readVertex(position, vertexIndex, new THREE.Vector3())
          const relativePos = vertex.clone().sub(group.center)

          const u = (relativePos.x / maxSize + 1) * 0.5
          const v = (relativePos.z / maxSize + 1) * 0.5

          geometry.attributes.uv.setXY(vertexIndex, u, v)
        }
      })
    }
  })

  geometry.attributes.uv.needsUpdate = true
  findGroupConnections(faceGroups, position)

  return { faceGroups, geometry }
}

function verticesAreEqual(v1: THREE.Vector3, v2: THREE.Vector3): boolean {
  const EPSILON = 1e-6
  return v1.distanceTo(v2) < EPSILON
}

function findSharedEdge(group1: FaceGroup, group2: FaceGroup, position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute): SharedEdge | null {
  let maxLength = 0
  let bestEdge: SharedEdge | null = null

  for (const face1 of group1.faces) {
    const vertices1: THREE.Vector3[] = []
    for (let i = 0; i < 3; i++) {
      const idx = face1 * 3 + i
      vertices1.push(readVertex(position, idx, new THREE.Vector3()))
    }

    const edges1 = [
      { start: vertices1[0], end: vertices1[1] },
      { start: vertices1[1], end: vertices1[2] },
      { start: vertices1[2], end: vertices1[0] },
    ]

    for (const face2 of group2.faces) {
      const vertices2: THREE.Vector3[] = []
      for (let i = 0; i < 3; i++) {
        const idx = face2 * 3 + i
        vertices2.push(readVertex(position, idx, new THREE.Vector3()))
      }

      const edges2 = [
        { start: vertices2[0], end: vertices2[1] },
        { start: vertices2[1], end: vertices2[2] },
        { start: vertices2[2], end: vertices2[0] },
      ]

      for (const edge1 of edges1) {
        for (const edge2 of edges2) {
          if (verticesAreEqual(edge1.start, edge2.start) && verticesAreEqual(edge1.end, edge2.end)) {
            const length = edge1.start.distanceTo(edge1.end)
            if (length > maxLength) {
              maxLength = length
              bestEdge = {
                start: edge1.start.clone(),
                end: edge1.end.clone(),
                normal1: group1.normal.clone(),
                normal2: group2.normal.clone(),
              }
            }
          } else if (verticesAreEqual(edge1.start, edge2.end) && verticesAreEqual(edge1.end, edge2.start)) {
            const length = edge1.start.distanceTo(edge1.end)
            if (length > maxLength) {
              maxLength = length
              bestEdge = {
                start: edge1.start.clone(),
                end: edge1.end.clone(),
                normal1: group1.normal.clone(),
                normal2: group2.normal.clone(),
              }
            }
          }
        }
      }
    }
  }
  return bestEdge
}
