import './api/syntax';

/**
 * @module http/dsl
 */
// prettier-ignore
export {
  group,
  Route,

  Capture,
  Header,
  Headers,
  QueryParam,
  ReqBody,

  JSON,
  PlainText,

  Get,
  Post,
  Put,

  Delete,
  PostCreated,
  PutCreated,

  GetNoContent,
  PostNoContent,
  PutNoContent,
  PatchNoContent,
  DeleteNoContent,
  HeadNoContent,
} from './api';
