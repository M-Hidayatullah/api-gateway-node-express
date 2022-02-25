const express = require('express');
const router = express.Router();
const isBase64 = require('is-base64');
const base64Img = require('base64-img');
const fs = require('fs');

const { Media } = require('../models');

// endpoint get list data
router.get('/', async(req, res) => {
    const media = await Media.findAll({
        attributes: ['id', 'image']
    });

    const mappedMedia = media.map((m) => {
        m.image = `${req.get('host')}/${m.image}`;
        return m;
    });

    return res.json({
        status: 'success',
        data: mappedMedia
    });
});

// end point create media
router.post('/', (req, res) => {
    const image = req.body.image;

    if (!isBase64(image, { mimeRequired: true })) {
        res.status(400).json({
            status: 'error',
            message: 'Image is not base64',
        });
    }
    base64Img.img(image, './public/images', Date.now(), async function(err, filepath) {
        if (err) {
            return res.status(400).json({
                status: 'error',
                message: err.message,
            });
        }

        const fileName = filepath.split("\\").pop().split("/").pop();

        const media = await Media.create({ image: `images/${fileName}` });

        return res.json({
            status: 'success',
            data: {
                id: media.id,
                image: `${req.get('host')}/images/${fileName}`,
            }
        })

    });
});

// endpoint to delete a media
router.delete('/:id', async(req, res) => {
    const id = req.params.id;

    // check id media in database or not
    const media = await Media.findByPk(id);

    if (!media) {
        return res.status(404).json({
            status: 'error',
            message: 'Media not found',
        });
    }
    // if media found, delete it
    fs.unlink(`./public/${media.image}`, async(err) => {
        if (err) {
            return res.status(400).json({
                status: 'error',
                message: err.message,
            });
        }

        await media.destroy();
        return res.status(200).json({
            status: 'success',
            message: 'Media deleted Successfully',
        });
    });
});

module.exports = router;