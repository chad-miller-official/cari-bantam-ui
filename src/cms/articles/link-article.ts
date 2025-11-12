import {ArticlePreview} from "../../articles/components/article-preview";
import { FullscreenSpinner } from "../../components/spinner";
import {setup, toggleButton} from "./form-common";

$(() => setup(() => toggleButton($('#publishTools > button[type=submit]'))))

export {ArticlePreview, FullscreenSpinner}