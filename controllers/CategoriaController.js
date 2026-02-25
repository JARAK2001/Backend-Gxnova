const CategoriaService = require("../services/CategoriaService");

const CategoriaController = {
    async obtenerCategorias(req, res) {
        try {
            const categorias = await CategoriaService.obtenerCategorias();
            return res.status(200).json({ categorias });
        } catch (error) {
            console.error("Error en CategoriaController.obtenerCategorias:", error);
            return res.status(500).json({ error: 'Error al obtener las categorías.' });
        }
    },

    async obtenerCategoriaPorId(req, res) {
        const id = parseInt(req.params.id);

        try {
            const categoria = await CategoriaService.obtenerPorId(id);

            if (!categoria) {
                return res.status(404).json({ error: 'Categoría no encontrada.' });
            }

            return res.status(200).json({ categoria });
        } catch (error) {
            console.error("Error en CategoriaController.obtenerCategoriaPorId:", error);
            return res.status(500).json({ error: 'Error al obtener la categoría.' });
        }
    },

    async crearCategoria(req, res) {
        const { nombre, descripcion } = req.body;

        if (!nombre) {
            return res.status(400).json({ error: 'El nombre de la categoría es obligatorio.' });
        }

        try {
            const nuevaCategoria = await CategoriaService.crearCategoria({
                nombre,
                descripcion
            });

            return res.status(201).json({
                message: "Categoría creada exitosamente.",
                categoria: nuevaCategoria
            });
        } catch (error) {
            console.error("Error en CategoriaController.crearCategoria:", error);
            return res.status(500).json({ error: 'Error al crear la categoría.' });
        }
    },

    async actualizarCategoria(req, res) {
        const id = parseInt(req.params.id);
        const { nombre, descripcion } = req.body;

        try {
            const categoriaExistente = await CategoriaService.obtenerPorId(id);
            if (!categoriaExistente) {
                return res.status(404).json({ error: 'Categoría no encontrada.' });
            }

            const categoriaActualizada = await CategoriaService.actualizarCategoria(id, {
                nombre,
                descripcion
            });

            return res.status(200).json({
                message: "Categoría actualizada correctamente.",
                categoria: categoriaActualizada
            });
        } catch (error) {
            console.error("Error en CategoriaController.actualizarCategoria:", error);
            return res.status(500).json({ error: 'Error al actualizar la categoría.' });
        }
    },

    async eliminarCategoria(req, res) {
        const id = parseInt(req.params.id);

        try {
            const categoriaExistente = await CategoriaService.obtenerPorId(id);
            if (!categoriaExistente) {
                return res.status(404).json({ error: 'Categoría no encontrada.' });
            }

            await CategoriaService.eliminarCategoria(id);

            return res.status(200).json({
                message: "Categoría eliminada correctamente."
            });
        } catch (error) {
            console.error("Error en CategoriaController.eliminarCategoria:", error);
            
            if (error.message.includes("trabajos asociados")) {
                return res.status(409).json({ error: error.message });
            }

            return res.status(500).json({ error: 'Error al eliminar la categoría.' });
        }
    }
};

module.exports = CategoriaController;

