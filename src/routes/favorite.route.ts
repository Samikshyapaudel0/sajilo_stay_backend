import { Router } from "express";
import { authorizedMiddleware } from "../middlewares/authorized.middleware";
import { FavoriteController } from "../controllers/favorite.controller";

const router = Router();
const favoriteController = new FavoriteController();

router.use(authorizedMiddleware);

router.post("/", favoriteController.addFavorite);
router.get("/", favoriteController.getFavorites);
router.delete("/:propertyId", favoriteController.removeFavorite);

export default router;
