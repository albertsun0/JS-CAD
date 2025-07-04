import * as jscad from '@jscad/modeling'
import { BufferGeometry, Float32BufferAttribute } from 'three'

export async function executeJSCAD(code: string): Promise<BufferGeometry> {
    try {
        // Create a sandboxed environment for JSCAD execution
        const sandbox = {
            require: (moduleName: string) => {
                if (moduleName === '@jscad/modeling') return jscad
                if (moduleName.startsWith('@jscad/modeling/')) {
                    const parts = moduleName.split('/')
                    let obj = jscad as any
                    for (let i = 2; i < parts.length; i++) {
                        obj = obj[parts[i]]
                    }
                    return obj
                }
                throw new Error(`Module ${moduleName} not found`)
            },
            module: { exports: {} },
            exports: {},
            console: console
        }

        // Execute the JSCAD code in the sandbox
        const func = new Function('require', 'module', 'exports', 'console', code)
        func(sandbox.require, sandbox.module, sandbox.exports, sandbox.console)

        // Get the main function
        const mainFunc = (sandbox.module.exports as any).main || (sandbox.exports as any).main
        if (typeof mainFunc !== 'function') {
            throw new Error('No main function found in JSCAD code')
        }

        // Execute the main function to get the geometry
        const jscadGeometry = mainFunc()

        // Convert JSCAD geometry to Three.js BufferGeometry
        return convertToThreeGeometry(jscadGeometry)
    } catch (error) {
        console.error('Error executing JSCAD code:', error)
        throw error
    }
}

function convertToThreeGeometry(jscadGeometry: any): BufferGeometry {
    try {
        // Get the polygons from the JSCAD geometry
        const polygons = jscad.geometries.geom3.toPolygons(jscadGeometry)

        const vertices: number[] = []
        const normals: number[] = []
        const indices: number[] = []

        let vertexIndex = 0

        for (const polygon of polygons) {
            // Get vertices from the polygon
            const polyVertices = polygon.vertices || []

            if (polyVertices.length < 3) {
                continue // Skip invalid polygons
            }

            // Calculate normal for the polygon
            let normal = [0, 0, 1] // Default normal

            if (polygon.plane && (polygon.plane as any).normal) {
                normal = (polygon.plane as any).normal
            } else {
                // Calculate normal from first 3 vertices using cross product
                const v1 = polyVertices[0]
                const v2 = polyVertices[1]
                const v3 = polyVertices[2]

                // Calculate vectors
                const a = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]]
                const b = [v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]]

                // Cross product
                normal = [
                    a[1] * b[2] - a[2] * b[1],
                    a[2] * b[0] - a[0] * b[2],
                    a[0] * b[1] - a[1] * b[0]
                ]

                // Normalize
                const length = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2])
                if (length > 0) {
                    normal = [normal[0] / length, normal[1] / length, normal[2] / length]
                }
            }

            // Triangulate the polygon (fan triangulation)
            for (let i = 1; i < polyVertices.length - 1; i++) {
                // Add triangle vertices
                const v0 = polyVertices[0]
                const v1 = polyVertices[i]
                const v2 = polyVertices[i + 1]

                vertices.push(v0[0], v0[1], v0[2])
                vertices.push(v1[0], v1[1], v1[2])
                vertices.push(v2[0], v2[1], v2[2])

                // Add normals (same for all vertices in the triangle)
                normals.push(normal[0], normal[1], normal[2])
                normals.push(normal[0], normal[1], normal[2])
                normals.push(normal[0], normal[1], normal[2])

                // Add indices
                indices.push(vertexIndex, vertexIndex + 1, vertexIndex + 2)
                vertexIndex += 3
            }
        }

        if (vertices.length === 0) {
            throw new Error('No valid vertices generated from JSCAD geometry')
        }

        // Validate arrays before creating geometry
        if (vertices.length !== normals.length) {
            console.warn(`Vertex/normal count mismatch: ${vertices.length} vs ${normals.length}`)
        }

        // Ensure indices are valid
        const maxIndex = (vertices.length / 3) - 1
        const validIndices = indices.filter(idx => idx <= maxIndex)

        if (validIndices.length !== indices.length) {
            console.warn(`Filtered ${indices.length - validIndices.length} invalid indices`)
        }

        // Create Three.js BufferGeometry
        const geometry = new BufferGeometry()

        // Create properly sized arrays
        const vertexArray = new Float32Array(vertices)
        const normalArray = new Float32Array(normals)

        geometry.setAttribute('position', new Float32BufferAttribute(vertexArray, 3))
        geometry.setAttribute('normal', new Float32BufferAttribute(normalArray, 3))

        // Only set indices if we have valid ones
        if (validIndices.length > 0 && validIndices.length % 3 === 0) {
            geometry.setIndex(validIndices)
        } else {
            console.warn('Skipping indices due to validation issues, using non-indexed geometry')
        }

        // Compute bounds and validate
        geometry.computeBoundingBox()
        geometry.computeBoundingSphere()

        // Additional validation
        if (geometry.attributes.position.count === 0) {
            throw new Error('Generated geometry has no vertices')
        }

        console.log(`Successfully converted JSCAD geometry: ${vertices.length / 3} vertices, ${validIndices.length / 3} triangles`)

        return geometry
    } catch (error) {
        console.error('Error converting JSCAD geometry to Three.js:', error)
        console.error('JSCAD geometry object:', jscadGeometry)

        // Return a fallback cube geometry
        return createFallbackGeometry()
    }
}

function createFallbackGeometry(): BufferGeometry {
    console.log('Creating fallback cube geometry')
    const geometry = new BufferGeometry()
    const size = 5

    const vertices = new Float32Array([
        // Front face
        -size, -size, size, size, -size, size, size, size, size,
        -size, -size, size, size, size, size, -size, size, size,
        // Back face
        -size, -size, -size, -size, size, -size, size, size, -size,
        -size, -size, -size, size, size, -size, size, -size, -size,
        // Top face
        -size, size, -size, -size, size, size, size, size, size,
        -size, size, -size, size, size, size, size, size, -size,
        // Bottom face
        -size, -size, -size, size, -size, -size, size, -size, size,
        -size, -size, -size, size, -size, size, -size, -size, size,
        // Right face
        size, -size, -size, size, size, -size, size, size, size,
        size, -size, -size, size, size, size, size, -size, size,
        // Left face
        -size, -size, -size, -size, -size, size, -size, size, size,
        -size, -size, -size, -size, size, size, -size, size, -size
    ])

    geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))
    geometry.computeVertexNormals()
    geometry.computeBoundingBox()
    geometry.computeBoundingSphere()

    return geometry
} 