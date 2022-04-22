--[[
@name MGP_Choose 萌娘百科の选择
@desc 对 {{#choose}} 解析器函数的纯 lua 实现，但有一些额外用法

@TODO 我们规定作为 <option> 使用的内容一定是匿名传参，即键值为数字
      任意键值非数字的传参，我们都认为是有特殊作用的
--]]
local p = {}
local getArgs = require('Module:Arguments').getArgs

function p.main(frame)
  local args = getArgs(frame)

  -- config
  local outerTag = args['tag'] or 'div'
  local outerClass = args['class'] or ''
  local outerStyle = args['style'] or ''
  local innerTag = args['inner-tag'] or 'div'
  local innerClass = args['inner-class'] or ''

  -- Create container
  local html =
    mw.html.create(outerTag):attr(
    {
      ['class'] = 'mgp-choose ' .. outerClass,
      ['style'] = outerStyle,
      ['data-count'] = args['count'] or 1
    }
  )

  for k, v in pairs(args) do
    if type(k) == 'number' then
      html:tag(innerTag):attr(
        {
          ['class'] = 'mgp-choose-option ' .. innerClass,
          ['data-mgp-choose-index'] = k,
          -- @TODO `weight-x` `wx` `权重x` 等传参被认为是选项 x 的权重
          ['data-weight'] = args['weight-' .. k] or args['权重' .. k] or args['w' .. k] or 1
        }
      ):wikitext(v):done()
    end
  end

  return html:done()
end

return p

--[[
  -- @test 以下测试用例使用了全部选项
  mw.log(
    p.main({
      ['tag'] = 'ul',
      ['inner-tag'] = 'li',
      ['class'] = 'custom-class',
      ['inner-class'] = 'heimu',
      ['style'] = 'color: blue',
      ['count'] = '123',
      'foo', 'bar', 'baz', 'lol',
      ['weight-4'] = 4
    })
  )
-- ]]
