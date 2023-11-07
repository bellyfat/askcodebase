import { ChatCompletionMessageParam } from 'openai/resources'

export const renderContent = (content: ChatCompletionMessageParam['content']) => {
  if (typeof content === 'string') {
    return content
  }
  if (Array.isArray(content)) {
    return content.map(part => {
      switch (part.type) {
        case 'text': {
          return <span>{part.text}</span>
        }
        case 'image_url': {
          return <img src={part.image_url.url} alt={part.image_url.detail} />
        }
      }
    })
  }
  return null
}
