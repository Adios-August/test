// 导入各个页面的API
import homeAPI from "./home";
import knowledgeAPI from "./knowledge";
import statsAPI from "./stats";
import loginAPI from "./login";

// 统一导出所有API
export { homeAPI, knowledgeAPI, statsAPI, loginAPI };

// 默认导出
export default {
  home: homeAPI,
  knowledge: knowledgeAPI,
  stats: statsAPI,
  login: loginAPI,
};
