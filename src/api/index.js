// 导入各个页面的API
import homeAPI from "./home";
import knowledgeAPI from "./knowledge";
import statsAPI from "./stats";

// 统一导出所有API
export { homeAPI, knowledgeAPI, statsAPI };

// 默认导出
export default {
  home: homeAPI,
  knowledge: knowledgeAPI,
  stats: statsAPI,
};
