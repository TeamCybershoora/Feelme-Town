import React from 'react'
import BadgeButton from '../components/ui/badge-button'
import AiInput from '../components/ui/ai-input'

const AiInputCard = () => {
    return (

        <div className='w-[95%] sm:w-[80%] md:w-[70%] lg:w-[61.5%] p-2 my-10 sm:my-16 lg:my-20 rounded-3xl shadow bg-white/10 dark:bg-black/10 border-2 border-black/10 dark:border-white/10 mx-auto'>
                <div className='h-full p-4 sm:p-6 bg-white/5 dark:bg-[#121212] shadow rounded-3xl mx-auto'>
                    
                <BadgeButton>Ask AI About Nishant</BadgeButton>
                <AiInput />
            </div>
        </div>

    )
}

export default AiInputCard