import styles from './components/Font.module.css';

export default function Home() {
  return (
    <>
    <section className=" flex flex-col  h-screen bg-orange-100 bg-no-repeat bg-cover">

    <div className=" w-full p-4   text-black flex border-b ">
   
    <nav className="space-x-8 w-full flex justify-end">
      <a href="">Home</a>
      <a href="">Books</a>
      <a href="">Movies</a>
      <a href="">TV-shows</a>
      <a href=""></a>
    </nav>
    </div>
    <div className="mx-24 mt-4 ">
      <div className='flex flex-col  mt-28'> 
      <h1 className={`text-6xl ${styles.fontMelodrama} text-blue-900`}>Very cool movie<br></br> and books app</h1>
      <p className='mt-8 text-orange-950'>Lorem ipsum dolor sit amet consectetur adipisicing elit.<br></br> Necessitatibus, porro libero soluta, assumenda.</p>
      
      </div>
      
    </div>
    <div className="custom-shape-divider-bottom-1760958993">
    <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z" class="shape-fill"></path>
    </svg>
</div>

   
    </section>
    <div className='bg-[#060046] h-screen flex text-white space-x-12 px-12'>
    <div className='w-1/3 flex'>
      <img src="https://edit.org/images/cat/book-covers-big-2019101610.jpg" className='w-1/3 h-1/3' alt="" />
      <div>
        <h2>Book title</h2>
        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quis iusto quasi debitis reiciendis recusandae! Praesentium ipsam amet quasi aut, quos fuga vero ea doloremque itaque molestias minus ullam quo magni!</p>
      </div>
    </div>
    <div className='w-1/3 flex'>
      <img src="https://edit.org/images/cat/book-covers-big-2019101610.jpg" className='w-1/3 h-1/3' alt="" />
      <div>
        <h2>Book title</h2>
        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quis iusto quasi debitis reiciendis recusandae! Praesentium ipsam amet quasi aut, quos fuga vero ea doloremque itaque molestias minus ullam quo magni!</p>
      </div>
    </div>
    <div className='w-1/3 flex'>
      <img src="https://edit.org/images/cat/book-covers-big-2019101610.jpg" className='w-1/3 h-1/3  ' alt="" />
      <div>
        <h2>Book title</h2>
        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quis iusto quasi debitis reiciendis recusandae! Praesentium ipsam amet quasi aut, quos fuga vero ea doloremque itaque molestias minus ullam quo magni!</p>
      </div>
    </div>
</div>

    </>
  
    
  );
}
